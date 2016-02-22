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
                return value;
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
    'underscore','d3'
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
            y1Formatter: d3.format(".01f"),
            showLegend: true
        };
    };

    return CoreViewsDefaultConfig;
});

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

(function(root) {
define("handlebars-utils", ["jquery","handlebars"], function() {
  return (function() {
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

Handlebars.registerPartial('scatterTooltip',$('#title-lblval-tooltip-template').html());
Handlebars.registerPartial('scatterTooltipNew',$('#title-lblval-tooltip-template-new').html());


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


  }).apply(root, arguments);
});
}(this));

(function(root) {
define("contrail-elements", ["jquery-ui"], function() {
  return (function() {
/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */
(function($) {
    $.ui.tabs.prototype._tabKeydown = function(event){
        return;
    };

    $.fn.contrailAutoComplete = function(option){
        var self = this;
        option = (typeof option === "undefined") ? {} : option;
        self.autocomplete(option);
        self.data('contrailAutoComplete', {
            value: function (value) {
                if (typeof value === 'undefined') {
                    return self.val();
                } else {
                    self.val(value);
                }
            }
        });
        return self;
    };

    $.fn.contrailMultiselect = function(option,option2){
        var self = this;
        option.multiple = true;
        self.data('contrailMultiselect', constructSelect2(self, option, option2));
        return self;
    };

    $.fn.contrailTabs = function(option) {
        var self = this,
            theme = 'overcast';

        option = (typeof option === "undefined") ? {} : option;

        if (contrail.checkIfExist(option.theme)) {
            theme = option.theme;
        }

        self.addClass('contrail-tabs-' + theme)
            .tabs(option)
            .data('contrailTabs', {
                _tabsUIObj: self.tabs(),
                startLoading: function(selectedTabLinkId){
                    $(selectedTabLinkId).prepend('<i class="icon-spinner icon-spin contrail-tabs-loading"></i>');
                },
                endLoading: function(selectedTabLinkId){
                    $(selectedTabLinkId).find('.contrail-tabs-loading').remove();
                },
                destroy: function() {
                    $(self).tabs('destroy');
                },
                refresh: function() {
                    $(self).tabs('refresh');
                },
                /*
                 * This function adds a tab to the existing tabs,which accepts two parameters
                 * id,name.Id is href for anchor tag(div id) and name is the tab name
                 */
                addTab: function(id,name,options) {
                    if(options != null && options['position'] == 'before') {
                        $(self).find('ul').first().prepend('<li><a href="#'+id+'">'+name+'</a></li>');
                        $(self).find('ul').after('<div id="'+id+'" style="display:none">'+name+'</div>');
                    } else {
                        $(self).find('ul').first().append('<li><a href="#'+id+'">'+name+'</a></li>');
                        $(self).append('<div id="'+id+'" style="display:none">'+name+'</div>');
                    }
                    $(self).tabs('refresh');
                },
                
                /*
                 * This function disables the tab and hides it based on the flag
                 * accepts either array of tab indexes or single tab index  
                 */
                disableTab: function (tabIndex, hide) {
                    if($.isArray(tabIndex)) {
                        for (var i = 0; i < tabIndex.length; i++) {
                            $(self).data('contrailTabs').disableTab(tabIndex[i], hide);
                        }
                        return;
                    }
                    
                    // Get the array of disabled tabs, if any
                    var disabledTabs = self.tabs("option", "disabled");

                    if ($.isArray(disabledTabs)) {
                        var pos = $.inArray(tabIndex, disabledTabs);

                        if (pos < 0) {
                            disabledTabs.push(tabIndex);
                        }
                    }
                    else {
                        disabledTabs = [tabIndex];
                    }
                    $(self).tabs("option", "disabled", disabledTabs);

                    if (hide === true) {
                        $(self).find('li:eq(' + tabIndex + ')').addClass('ui-state-hidden');
                    }
                },
                /*
                 * This function enables the tab which accepts either array of
                 * indexes or single tab index  
                 */
                enableTab: function (tabIndex) {
                    if($.isArray(tabIndex)) {
                        for (var i = 0; i < tabIndex.length; i++) {
                            $(self).data('contrailTabs').enableTab(tabIndex[i]);
                        }
                        return;
                    }
                    $(self).find('li:eq(' + tabIndex + ')').removeClass('ui-state-hidden');
                    $(self).tabs("enable", tabIndex);
                },

                activateTab: function (tabIndex) {
                    $(self).tabs({ active: tabIndex });
                }
            });

        return self;
    };

    $.fn.contrailNumericTextbox = function (option) {
        var self = this;
        option = (typeof option === "undefined") ? {} : option;
        self.spinner(option);
        self.data('contrailNumericTextbox', {
            value: function (value) {
                if (typeof value === 'undefined') {
                    return self.spinner("value");
                } else {
                    self.spinner("value", value);
                }
            },
            destroy: function() {
                self.spinner("destroy");
            }
        });
        return self;
    };

    $.fn.contrailDateTimePicker = function(option) {
        var self = this,
            defaultOption = {
                formatDate: 'M d, Y',
                formatTime: 'h:i:s A',
                format: 'M d, Y h:i:s A',
                step: 10,
                displayFormat: 'MMM DD, YYYY hh:mm:ss A'
            };
        option = (typeof option === "undefined") ? {} : option;

        option = $.extend(true, defaultOption, option);

        this.addClass('datetimepicker')
            .datetimepicker(option);

        self.data('contrailDateTimePicker', {
            option: option,
            setMinDateTime: function(minDateTime) {
                self.data('contrailDateTimePicker').option.minDate = moment(minDateTime).format('MMM DD, YYYY');
                self.data('contrailDateTimePicker').option.minTime = moment(minDateTime).format('hh:mm:ss A');

                self.addClass('datetimepicker')
                    .datetimepicker(self.data('contrailDateTimePicker').option);
            },
            setMaxDateTime: function(maxDate) {
                self.data('contrailDateTimePicker').option.maxDate = maxDate;
                self.addClass('datetimepicker')
                    .datetimepicker(self.data('contrailDateTimePicker').option);
            },
            val: function(dateTime) {
                console.warn('Contrail WebUI Warning: Function val of ContrailDateTimePicker is deprecated. Use value() instead.');
                self.val(moment(dateTime).format(option.displayFormat));
            },
            value: function(dateTime) {
                if(!contrail.checkIfExist(dateTime)) {
                    return self.val();
                } else {
                    var value = moment(dateTime).format(option.displayFormat);
                    self.val(value);
                    return value;
                }
            },
            destroy: function() {
                self.datetimepicker('destroy')
            }
        });
        return self;
    };

    $.fn.contrailDropdown = function(defaultOption, args) {
        var self = this;
        self.data('contrailDropdown', constructSelect2(self, defaultOption, args));
        return self;
    };

    $.fn.contrailCombobox = function(customOption) {
        var option = $.extend(true, {}, customOption),
            self = this, formattedData = [],
            asyncVal = false;

        self.globalSelect = {};
        self.globalDisableList = [];

        option = (typeof option === "undefined") ? {} : option;

        if(typeof option === 'string'){
            var input = self.next().find('.custom-combobox-input');
            input.autocomplete(option);

            if(option == 'enable'){
                input.removeAttr('disabled');
            }
            else if(option == 'disable'){
                input.attr('disabled','disabled');
            }
        } else {
            option.dataTextField = {dsVar: option.dataTextField, apiVar: 'value'};
            option.dataValueField = {dsVar: option.dataValueField, apiVar: 'id'};
            if(!$.isEmptyObject(option) && typeof option.dataSource !== 'undefined') {
                if(option.dataSource.type == "remote"){
                    if(contrail.checkIfExist(option.dataSource.async)){
                        asyncVal =  option.dataSource.async;
                    }
                    $.ajax({
                        url: option.dataSource.url,
                        dataType: "json",
                        async: asyncVal,
                        success: function( data ) {
                            if(typeof option.dataSource.parse !== "undefined"){
                                var parsedData = option.dataSource.parse(data);
                                formattedData = formatData(parsedData, option);
                            }else {
                                formattedData = formatData(data, option);
                            }
                            if(contrail.checkIfExist(option.dataSource.async) && option.dataSource.async == true ){
                                self.data('contrailCombobox').setData(parsedData);
                            }
                        }
                    });
                } else if(option.dataSource.type == "local"){
                    formattedData = formatData(option.dataSource.data, option);
                }
            } else if (self.is('select')) {
                self.children("option").each(function (key, val) {
                    formattedData.push({
                        id: val.value,
                        value: val.innerHTML });
                });
            }
            constructCombobox(self, option, formattedData);

            self.data('contrailCombobox', {
                value: function (value) {
                    var text, sourceValue, item4Value;
                    if (typeof value === 'undefined') {
                        var visibleValue = self.next().find('.custom-combobox-input').val();
                        if(contrail.checkIfExist(self.option.sourceMap[visibleValue])) {
                            sourceValue = self.option.sourceMap[visibleValue];
                            return self.option.source[sourceValue][self.option.dataValueField.apiVar];
                        } else {
                            // User entered a value not present in droplist. So just return the text itself.
                            return visibleValue;
                        }
                    } else {
                        item4Value = this.getItem4Value(value);
                        if(typeof item4Value === 'object') {
                            text = item4Value['value'];
                        } else {
                            text = item4Value;
                        }
                        self.next().find('.custom-combobox-input').val(text);
                    }
                },
                text: function (text) {
                    if(typeof text === 'undefined'){
                        return self.next().find('.custom-combobox-input').val();
                    } else {
                        self.next().find('.custom-combobox-input').val(text);
                        return true;
                    }
                },
                getSelectedItem: function() {
                    var dataVF = this.value();
                    return this.getItem4Value(dataVF);
                },
                getItem4Value: function(value) {
                    var sourceData = self.option.source,
                        dataValueField = self.option.dataValueField;
                    for (var i = 0 ;i < self.option.source.length; i++){
                        if (sourceData[i][dataValueField.dsVar] === value || sourceData[i][dataValueField.apiVar] === value){
                            return sourceData[i];
                        }
                    }
                    return value;
                },
                setData: function(data) {
                    formattedData = formatData(data, self.option);
                    constructCombobox(self, self.option, formattedData);
                },
                destroy: function(){
                    self.show();
                    self.next('.custom-combobox').find('input').autocomplete('destroy');
                    self.next('.custom-combobox').remove();
                },
                getAllData: function(){
                    return self.option.source;
                },
                enable: function(flag) {
                    var input = self.next('.custom-combobox').find('input');

                    if(flag){
                        input.autocomplete('enable');
                        input.removeAttr('disabled');
                    } else {
                        input.autocomplete('disable');
                        input.attr('disabled','disabled');
                    }
                },
                enableOptionList: function (flag, disableItemList) {
                    for(var i=0; i<disableItemList.length; i++){
                        if(flag == false){
                            if(self.globalDisableList.indexOf(disableItemList[i]) == -1){
                                self.globalDisableList.push(disableItemList[i]);
                            }
                        } else if (flag == true){
                            self.globalDisableList.pop(disableItemList[i]);
                        }
                    }
                },
                isEnabled: function () {
                    var input = self.next('.custom-combobox').find('input');
                    if (input.attr('disabled') == "disabled") {
                        return false;
                    } else {
                        return true;
                    }
                },
                isEnabledOption: function(optionText){
                    var result = self.globalDisableList.indexOf(optionText);
                    if(result === -1)
                        return true;
                    return false;
                },
                hide: function(){
                    self.next('.custom-combobox').hide();
                },
                show: function(){
                    self.next('.custom-combobox').show();
                }
            });
        }
        return self;

        function getComboboxOption(givenOptions) {
            var option = {
                delay: 500,
                minLength: 0,
                placeholder: "Select...",
                dataTextField: "value",
                dataValueField: "id",
                select: function (e, ui) {
                    self.globalSelect = ui.item;
                }
            };
            $.extend(true, option, givenOptions);
            return option;
        }

        function constructCombobox(dis, givenOptions, formattedData){
            var wrapper, input,
                option = getComboboxOption(givenOptions),
                wasOpen = null;
            option.source = formattedData;
            dis.option = option;
            dis.globalSelect = {};
            dis.globalDisableList = [];
            dis.hide();
            dis.next('.custom-combobox').find('input').autocomplete('destroy');
            dis.next('.custom-combobox').remove();

            wrapper = $('<div>')
                .addClass( 'custom-combobox input-append ' + dis.attr('class'))
                .insertAfter( dis );

            input = $( "<input>" )
                .addClass('custom-combobox-input span12')
                .appendTo( wrapper )
                .autocomplete(option)
                .attr('placeholder', option.placeholder)

                // update the combobox when the input is updated to keep both in sync
                .on( "autocompleteselect", function( event, ui ) {
                    dis.val(ui.item.value);
                    dis.trigger('change');
                })
                .on('change', function(event){
                    dis.val($(event.target).val());
                    dis.trigger('change');
                });

            if(contrail.checkIfExist(option.defaultValue)){
                    input.val(option.defaultValue);
            }

            input.data("ui-autocomplete")._renderItem = function (ul, item) {
                if(dis.globalDisableList.indexOf(item.label) != -1){
                    return $('<li class="ui-state-disabled">'+item.label+'</li>').appendTo(ul);
                }else{
                    return $("<li>")
                        .append("<a>" + item.label + "</a>")
                        .appendTo(ul);
                }
            };

            $("<span>")
                .addClass('add-on')
                .appendTo( wrapper )
                .mousedown(function() {
                    wasOpen = input.autocomplete( "widget" ).is( ":visible" );
                })
                .click(function() {
                    input.focus();

                    // Close if already visible
                    if ( wasOpen ) {
                        return;
                    }

                    input.autocomplete( "search", "" );
                })
                .append('<i class="icon-caret-down"></i>');
            dis.option.sourceMap = constructSourceMap(formattedData, 'value');
        };
    };

    $.fn.contrail2WayMultiselect = function (givenOptions) {
    	var self = this;
        var defaultOptions = {
            dataTextField: "label",
            dataValueField: "value",
            leftTitle: "Left",
            rightTitle: "Right",
            sizeLeft: 8,
            sizeRight: 8,
            controls: {
            	single: true,
            	all: true
            },
			beforeMoveOneToRight: function() { return true; },
			afterMoveOneToRight: function(){},
			beforeMoveAllToRight: function(){ return true; },
			afterMoveAllToRight: function(){},
			beforeMoveOneToLeft: function(){ return true; },
			afterMoveOneToLeft: function(){},
			beforeMoveAllToLeft: function(){ return true; },
			afterMoveAllToLeft: function(){}
        };
        var options = $.extend({}, defaultOptions, givenOptions);
        constructContrail2WayMultiselect(this, options);

        options = (typeof options === "undefined") ? {} : options;

        var multiselectContainer = {
        		lists: {
        			left: $(this).find('.multiselect-left'),
            		right: $(this).find('.multiselect-right')
        		},
        		controls: {
        			leftAll: $(this).find('.multiselect-control-left-all'),
        			leftSelected: $(this).find('.multiselect-control-left-selected'),
        			rightAll: $(this).find('.multiselect-control-right-all'),
        			rightSelected: $(this).find('.multiselect-control-right-selected')
        		}
        	};

        function getListData(selector){
        	var result = [];
            selector.each(function() {
                var item = {};
                item[options.dataValueField] = $(this).data('value');
                item[options.dataTextField] = $(this).text();
                result.push(item);
            });
            return result;
        }

        function moveLeftToRight(){
        	if(options.beforeMoveOneToRight() && !self.find('.contrail2WayMultiselect').hasClass('disabled')){
	        	var leftSelectedData = getListData(multiselectContainer.lists.left.find('li.ui-selected'));
	        	self.data('contrail2WayMultiselect').deleteLeftData(leftSelectedData);
	        	self.data('contrail2WayMultiselect').updateRightData(leftSelectedData);
	        	options.afterMoveOneToRight();
        	}
        	
        }

        function moveRightToLeft(){
        	if(options.beforeMoveOneToLeft() && !self.find('.contrail2WayMultiselect').hasClass('disabled')){
	        	var rightSelectedData = getListData(multiselectContainer.lists.right.find('li.ui-selected'));
	        	self.data('contrail2WayMultiselect').deleteRightData(rightSelectedData);
	        	self.data('contrail2WayMultiselect').updateLeftData(rightSelectedData);
	        	options.afterMoveOneToLeft();
        	}
        }

        function moveLeftAll(){
        	if(options.beforeMoveAllToRight() && !self.find('.contrail2WayMultiselect').hasClass('disabled')){
	        	var leftData = getListData(multiselectContainer.lists.left.find('li'));
	        	self.data('contrail2WayMultiselect').deleteLeftAllData();
	        	self.data('contrail2WayMultiselect').updateRightData(leftData);
	        	options.afterMoveAllToRight();
        	}
        }

        function moveRightAll(){
        	if(options.beforeMoveAllToLeft() && !self.find('.contrail2WayMultiselect').hasClass('disabled')){
	        	var rightData = getListData(multiselectContainer.lists.right.find('li'));
	        	self.data('contrail2WayMultiselect').deleteRightAllData();
	        	self.data('contrail2WayMultiselect').updateLeftData(rightData);
	        	options.afterMoveAllToLeft();
        	}
        }

        multiselectContainer.controls.leftSelected.on('click', function(){
        	moveLeftToRight();
        });

        multiselectContainer.controls.rightSelected.on('click', function(){
        	moveRightToLeft();
        });

        multiselectContainer.controls.leftAll.on('click', function(){
        	moveLeftAll();
        });

        multiselectContainer.controls.rightAll.on('click', function(){
        	moveRightAll();
        });

        self.data('contrail2WayMultiselect', {
            getLeftData: function () {
            	return getListData(multiselectContainer.lists.left.find('li'));
            },
            getRightData: function () {
            	return getListData(multiselectContainer.lists.right.find('li'));
            },
            setLeftData: function (data) {
                this.deleteLeftAllData();
                this.updateLeftData(data);
            },
            setRightData: function (data) {
                this.deleteRightAllData();
                this.updateRightData(data);
            },
            updateLeftData: function (data) {
                $.each(data, function(key,val){
                	$(multiselectContainer.lists.left).append('<li class="ui-widget-content" data-value="' + val[options.dataValueField] + '">' + val[options.dataTextField] + '</li>');
                });
            },
            updateRightData: function (data) {
            	$.each(data, function(key,val){
                	$(multiselectContainer.lists.right).append('<li class="ui-widget-content" data-value="' + val[options.dataValueField] + '">' + val[options.dataTextField] + '</li>');
                });
            },
            getLeftSelectedData: function () {
            	return getListData(multiselectContainer.lists.left.find('li.ui-selected'));
            },
            getRightSelectedData: function () {
            	return getListData(multiselectContainer.lists.right.find('li.ui-selected'));
            },
            deleteLeftData: function (data) {
            	$.each(data, function(key,val){
                	$(multiselectContainer.lists.left).find('li[data-value="' + val[options.dataValueField] + '"]').remove();
                });
            },
            deleteLeftAllData: function () {
                multiselectContainer.lists.left.find('li').remove();
            },
            deleteRightData: function (data) {
            	$.each(data, function(key,val){
                	$(multiselectContainer.lists.right).find('li[data-value="' + val[options.dataValueField] + '"]').remove();
                });
            },
            deleteRightAllData: function () {
                multiselectContainer.lists.right.find('li').remove();
            },
            show: function () {
            	self.find('.contrail2WayMultiselect').show();
            },
            hide: function () {
                self.find('.contrail2WayMultiselect').hide();
            },
            disable: function () {
                self.find('.contrail2WayMultiselect').addClass('disabled');
                self.find('.multiselect-list').selectable('disable');
            },
            enable: function () {
            	self.find('.contrail2WayMultiselect').removeClass('disabled');
            	self.find('.multiselect-list').selectable('enable');
            },
            destroy: function(){
            	self.find('.multiselect-list').selectable('destroy');
            	self.html('');
            }
        });
        function constructContrail2WayMultiselect(self, options){
        	self.html('<div class="contrail2WayMultiselect row-fluid">\
                <div class="span5">\
                    <label>'+options.leftTitle+'</label>\
                    <ol class="row-fluid multiselect-left multiselect-list" style="height:'+(options.sizeLeft * 30).toString()+'px;"></ol>\
                </div>\
                <div class="span2 multiselect-controls">\
                    ' + ((options.controls.single) ? '<div class="row-fluid multiselect-control"><i title="Move to Left" class="multiselect-control-left-selected icon-angle-right"></i></div>\
                    <div class="row-fluid multiselect-control"><i title="Move to Right" class="multiselect-control-right-selected icon-angle-left"></i></div>' : '') + '\
                    ' + ((options.controls.all) ? '<div class="row-fluid multiselect-control"><i title="Move to Left" class="multiselect-control-left-all icon-double-angle-right"></i></div>\
                    <div class="row-fluid multiselect-control"><i title="Move to Right" class="multiselect-control-right-all icon-double-angle-left"></i></div>' : '') + '\
                </div>\
                <div class="span5">\
                     <label>'+options.rightTitle+'</label>\
                     <ol class="row-fluid multiselect-right multiselect-list" style="height:'+(options.sizeRight * 30).toString()+'px;"></ol>\
                </div>\
            </div>');

            self.find('.multiselect-list').selectable();
        };
    };

    $.fn.contrailWizard = function (config) {
        var defaultConfig = {
            enableStepJump: false
        };

        config = $.extend(true, {}, config, defaultConfig);

        var self = this,
            steps = config.steps,
            stepsInitFlag = [];

        self.addClass('contrailWizard');

        for (var i = 0 ; i < steps.length ; i++){
            stepsInitFlag.push(false);
        }

        config.onInit = function (event, currentIndex) {
            var onInitCompleteCBCalled = false,
                onInitCompleteCB = function(currentStep, config) {
                    if (contrail.checkIfFunction(currentStep.onLoadFromPrevious)) {
                        currentStep.onLoadFromPrevious(config.params);
                    }
                    if (contrail.checkIfFunction(currentStep.onLoadFromNext)) {
                        currentStep.onLoadFromNext(config.params);
                    }
                    configureButton(currentStep.buttons);
                };

            $.each(steps, function(stepKey, stepValue){
                if (contrail.checkIfFunction(stepValue.onInitWizard)) {
                    stepValue.onInitWizard(config.params, function() {
                        onInitCompleteCB(stepValue, config);
                    });
                    onInitCompleteCBCalled = true;
                    stepsInitFlag[stepKey] = true;
                }
            });

            if (!stepsInitFlag[currentIndex]) {
                if (contrail.checkIfFunction(steps[currentIndex].onInitFromPrevious)) {
                    steps[currentIndex].onInitFromPrevious(config.params, function() {
                        onInitCompleteCB(steps[currentIndex], config);
                    });
                    onInitCompleteCBCalled = true;
                }
                else if(contrail.checkIfFunction(steps[currentIndex].onInitFromNext)) {
                    steps[currentIndex].onInitFromNext(config.params, function() {
                        onInitCompleteCB(steps[currentIndex], config);
                    });
                    onInitCompleteCBCalled = true;
                }
                stepsInitFlag[currentIndex] = true;
            }

            if (!onInitCompleteCBCalled) {
                onInitCompleteCB(steps[currentIndex], config)
            }

        };

        config.onStepChanged = function(event, currentIndex, priorIndex) {
            var currentStepLiElement = self.find('.steps').find('li:eq(' + currentIndex + ')'),
                onInitCompleteCBCalled = false,
                onInitCompleteCB = function(currentStep, config) {
                    if (currentIndex > priorIndex && contrail.checkIfFunction(currentStep.onLoadFromNext)) {
                        currentStep.onLoadFromNext(config.params);
                    }
                    else if (currentIndex < priorIndex && contrail.checkIfFunction(currentStep.onLoadFromPrevious)) {
                        currentStep.onLoadFromPrevious(config.params);
                    }
                    configureButton(currentStep.buttons);
                };

            if (currentIndex < priorIndex) {
                self.find('.steps').find('li:eq(' + priorIndex + ')').removeClass('done');
                currentStepLiElement.removeClass('completed');
            }
            else if(currentIndex > priorIndex) {

                if(!currentStepLiElement.hasClass('subStep')) {
                    currentStepLiElement = self.find('.steps').find('li.done').addClass('completed')
                }
            }

            if(!stepsInitFlag[currentIndex]) {
                if (currentIndex > priorIndex && contrail.checkIfFunction(steps[currentIndex].onInitFromNext)) {
                    steps[currentIndex].onInitFromNext(config.params, function() {
                        onInitCompleteCB(steps[currentIndex], config)
                    });
                    onInitCompleteCBCalled = true;
                }
                else if(currentIndex < priorIndex && contrail.checkIfFunction(steps[currentIndex].onInitFromPrevious)) {
                    steps[currentIndex].onInitFromPrevious(config.params, function() {
                        onInitCompleteCB(steps[currentIndex], config)
                    });
                    onInitCompleteCBCalled = true;
                }
                stepsInitFlag[currentIndex] = true;
            }

            if(!onInitCompleteCBCalled) {
                onInitCompleteCB(steps[currentIndex], config)
            }

        };

        config.onStepChanging = function (event, currentIndex, newIndex) {

            if (Math.abs(currentIndex - newIndex) != 1 && !config.enableStepJump) {
                return false;
            }
            var returnFlag = true;
            // Next Button clicked
            if(currentIndex < newIndex && contrail.checkIfFunction(steps[currentIndex].onNext)) {
                returnFlag = steps[currentIndex].onNext(config.params);
            }
            // Previous Button Clicked
            else if(currentIndex > newIndex && contrail.checkIfFunction(steps[currentIndex].onPrevious)) {
                returnFlag = steps[currentIndex].onPrevious(config.params);
            }

            if(returnFlag) {
                self.find('.steps').find('li:eq(' + newIndex + ')').removeClass('completed');
            }
            return returnFlag;
        };

        config.onFinished = function (event, currentIndex) {
            steps[currentIndex].onNext(config.params);
        };

        self.steps(config);

        self.find('.actions').find('a').addClass('btn btn-mini');
        self.find('.actions').find('a[href="#next"]').addClass('btn-primary');
        self.find('.actions').find('a[href="#finish"]').addClass('btn-primary');

        $('.wizard > .steps > ul > li').css({
            'max-width': (100/steps.length) + '%'
        });

        var stepIndex = 0;
        $('.wizard > .steps ul li').each(function(key, value){
            if(steps[key].stepType == 'sub-step'){
                $(this).addClass('subStep');
                $(this).find('.number').text('');
                $(this).find('.title').text('');

            }
            else {
                $(this).find('.number').text(++stepIndex);
            }
        });

        function configureButton(buttons){
            self.find('.actions').find('a').parent('li[aria-hidden!="true"]').show();
            if(contrail.checkIfExist(buttons)) {
                $.each(buttons, function (buttonKey, buttonValue) {
                    if (buttonValue.visible === false) {
                        self.find('.actions').find('a[href="#' + buttonKey + '"]').parent('li').hide();
                    }
                    if (contrail.checkIfExist(buttonValue.label)) {
                        self.find('.actions').find('a[href="#' + buttonKey + '"]').empty().append(buttonValue.label);
                    }
                });
            }
        }

        self.data('contrailWizard', $.extend(true, {}, getDefaultStepsMethods(), {
            'getStepsLength': function() {
                return steps.length;
            }
        }));

        function getDefaultStepsMethods() {
            var methodObj = {},
                defaultMethods = ['getCurrentStep', 'getCurrentIndex', 'next', 'previous', 'finish', 'destroy', 'skip'];

            $.each(defaultMethods, function (defaultMethodKey, defaultMethodValue) {
                methodObj[defaultMethodValue] = function () {
                    return self.steps(defaultMethodValue);
                };
            });

            return methodObj;
        }
    };

    $.fn.contrailCheckedMultiselect = function (config) {
        var self = this,
            parse = contrail.checkIfFunction(config.parse) ? config.parse: null;

        self.prop('id',config.elementId);
        config.dataTextField = {dsVar: config.dataTextField, apiVar: 'text'};
        config.dataValueField = {dsVar: config.dataValueField, apiVar: 'id'};

        var defaultConfig = {
                dataTextField : 'text',
                dataValueField: 'id',
                //header: false,
                minWidth: 'auto',
                control: false,
                selectedList: 3,
                tristate: false,
                emptyOptionText: 'No option found.',
                position: {
                    my: 'left top',
                    at: 'left bottom'
                }
            },
            defaultFilterConfig = {
                label: false
            },
            config = $.extend(true, defaultConfig, config),
            defaultFilterConfig = $.extend(true, defaultFilterConfig, config.filterConfig),
            template = null, preChecked = [],
            multiSelectMenu = null;

            if(config.tristate) {
                config.optgrouptoggle = function(event, ui) {
                   multiSelectMenu.find('input[type="checkbox"]').tristate('state', ui.checked);
                }
            }

        function constructCheckedMultiselect (config, defaultFilterConfig) {
            template = contrail.getTemplate4Id('checked-multiselect-optgroup-template');
            $(self).find('select').remove();
            $(self).find('button').remove();
            $(self).append(template(config));

            if (config.data.length == 0) {
                config.height = 'auto';
            }

            var multiselect = self.find('select').multiselect(config).multiselectfilter(defaultFilterConfig);
            preChecked = self.find('select').multiselect('getChecked');

            multiSelectMenu = self.find('select').multiselect("widget");

            if (config.data.length == 0) {
                multiSelectMenu.append('<p class="padding-0-0-5 margin-0-5">'+ config.emptyOptionText + '</p>')
            }

            if(config.tristate){
                multiSelectMenu.find('input[type="checkbox"]').tristate({state: null}).addClass('ace-input-tristate');
            } else {
                multiSelectMenu.find('input[type="checkbox"]').addClass('ace-input');
            }
            multiSelectMenu.find('input[type="checkbox"]').next('span').addClass('ace-lbl');
            /*
             * Appending controls and related events
             */
            if(config.control != false) {
                var msControls = $('<div class="row-fluid ui-multiselect-controls""></div>');

                $.each(config.control, function(controlKey, controlValue) {
                    var btn = $('<button class="btn btn-mini ' + (contrail.checkIfExist(controlValue.cssClass) ? controlValue.cssClass : '') +
                        ' pull-right ui-multiselect-control-apply">' + controlValue.label + '</button>');
                    msControls.append(btn);

                    if (contrail.checkIfFunction(controlValue.click)) {
                        btn.on('click', function () {
                            var checkedRows = [];
                            if(config.tristate){
                                checkedRows = multiSelectMenu.find('input[type="checkbox"]:determinate');
                            } else {
                                checkedRows = self.find('select').multiselect('getChecked');
                            }
                            controlValue.click(self, checkedRows);
                            self.find('select').multiselect('close');
                        })
                    }
                });

                multiSelectMenu.append(msControls);
            }

            var closeFn = function(event) {
                var positionTop = multiSelectMenu.position().top,
                    scrollTop = $(this).scrollTop();

                if (multiSelectMenu.is(':visible') && (positionTop - scrollTop) < 40) {
                    self.find('select').multiselect('close');
                }
            };

            $(window)
                .off('scroll', closeFn)
                .on('scroll', closeFn);

            self.data('contrailCheckedMultiselect', $.extend(true, getDefaultMultiselectMethods(), {
                getPreChecked: function () {
                    return preChecked;
                },
                setChecked: function (checkedElements) {
                    this.uncheckAll();
                    $.each(checkedElements, function (elementKey, elementValue) {
                        $(elementValue).click();
                    });
                },
                setCheckedState: function (state) {
                    this.uncheckAll();
                    if(config.tristate) {
                        if (typeof state === "boolean" || state == null) {
                            multiSelectMenu.find('input[type="checkbox"]').tristate('state', state)
                        } else if (typeof state === "object") {
                            $.each(state, function (stateKey, stateValue) {
                                $(multiSelectMenu.find('input[type="checkbox"]')[stateKey]).tristate('state', stateValue);
                            });
                        }
                    } else {
                        if(typeof state === "boolean" && state) {
                            this.checkAll();
                        }
                        //TODO handle else if typeof state === object
                    }
                },
                refresh: function () {
                    this.destroy();
                    initCheckedMultiselect(config, defaultFilterConfig);
                }
            }));
        };

        function initCheckedMultiselect (config, defaultFilterConfig) {
            if(contrail.checkIfExist(config.dataSource)){
                contrail.ajaxHandler(config.dataSource, null, function (response){
                    if(!contrail.checkIfExist(response)){
                        throw "Error getting data from server";
                    }
                    var parsedData = (contrail.checkIfFunction(parse)) ? parse(response) : response;
                    config.data = formatData(parsedData, config);
                    constructCheckedMultiselect(config, defaultFilterConfig);
                });
            } else {
                constructCheckedMultiselect(config, defaultFilterConfig);
            }
        }

        if (contrail.checkIfExist(config.data)) {
            config.data = formatData((contrail.checkIfFunction(parse)) ? parse(config.data) : config.data, config);
        }

        if (!contrail.checkIfExist(self.data('contrailCheckedMultiselect'))) {
            initCheckedMultiselect(config, defaultFilterConfig);
        }
        else {
            self.find('select').multiselect(config);
        }

        function getDefaultMultiselectMethods () {
            var methodObj = {},
                defaultMethods = ['open', 'refresh', 'uncheckAll', 'getChecked', 'disable', 'enable', 'destroy'];

            $.each(defaultMethods, function (defaultMethodKey, defaultMethodValue) {
                methodObj[defaultMethodValue] = function () {
                    return self.find('select').multiselect(defaultMethodValue);
                };
            });

            return methodObj;
        }
    };

    $.extend({
        contrailBootstrapModal:function (options) {
            var keyupAction = $.extend(true, {}, {
                onKeyupEnter: null,
                onKeyupEsc: null
            }, options.keyupAction);

            options.id = options.id != undefined ? options.id : '';
            var className = (options.className == null) ? '' : options.className;

            var modalHTML = '<div id="' + options.id + '" class="' + className + ' modal contrail-modal hide" tabindex="-1" role="dialog" aria-hidden="true"> \
        		<div class="modal-header"> \
        	    	<button id="modal-header-close" type="button" class="close"><i class="icon-remove"></i></button> \
        			<h6 class="modal-header-title"></h6> \
        		</div> \
	        	<div class="modal-body"></div> \
	        	<div class="modal-footer"></div> \
        	</div>';

            $('#' + options.id).remove();
            $('body').prepend(modalHTML);

            if(options.closeClickAction != null) {
                $('#modal-header-close').on('click', function() {
                    if(typeof options.closeClickAction === 'function'){
                        options.closeClickAction(options.closeClickParams);
                    }
                    else if(typeof options.closeClickAction === 'string'){
                        window[options.closeClickAction](options.closeClickParams);
                    }
                });
            } else {
                $('#modal-header-close').attr('data-dismiss', 'modal');
                $('#modal-header-close').attr('aria-hidden', 'true');
            }
            var modalId = $('#' + options.id);

            modalId.find('.modal-header-title').empty().append(options.title != undefined ? options.title : '&nbsp;');
            modalId.find('.modal-body').empty().append(options.body);

            if(options.footer != false) {
                $.each(options.footer, function (key, footerButton) {
                    function performFooterBtnClick(footerButton) {
                        if (typeof footerButton.onclick === 'function') {
                            footerButton.onclick(footerButton.onClickParams);
                        }
                        else if (footerButton.onclick != 'close' && typeof footerButton.onclick === 'string') {
                            window[footerButton.onclick](footerButton.onClickParams);
                        }
                    }

                    var btnId = (footerButton.id != undefined && footerButton.id != '') ? footerButton.id : options.id + 'btn' + key,
                        btn = '<button id="' + btnId + '" class="btn btn-mini ' + ((footerButton.className != undefined && footerButton.className != '') ? footerButton.className : '') + '"'
                            + ((footerButton.onclick === 'close') ? ' data-dismiss="modal" aria-hidden="true"' : '') + '>'
                            + ((footerButton.title != undefined) ? footerButton.title : '') + '</button>';

                    modalId.find('.modal-footer').append(btn);
                    $('#' + btnId).on('click', function () {
                        performFooterBtnClick(footerButton);
                    });

                    if (!contrail.checkIfFunction(keyupAction.onKeyupEnter) && footerButton.onKeyupEnter) {
                        keyupAction.onKeyupEnter = function () { performFooterBtnClick(footerButton); };
                    } else if (!contrail.checkIfFunction(keyupAction.onKeyupEsc) && footerButton.onKeyupEsc) {
                        keyupAction.onKeyupEsc = function () { performFooterBtnClick(footerButton); };
                    }
                });
            }
            else {
                modalId.find('.modal-footer').remove();
            }
            modalId.modal({backdrop:'static', keyboard:false});

            modalId.offset({left: ($(document).width() - modalId.width()) / 2, top: $(document).scrollTop() + 50});

            modalId
                .draggable({
                    handle: ".modal-header",
                    containment: 'body',
                    cursor: 'move'
                });


            if (contrail.checkIfFunction(keyupAction.onKeyupEnter) || contrail.checkIfFunction(keyupAction.onKeyupEsc)) {
                modalId.keyup(function(event) {
                    var code = event.which; // recommended to use e.which, it's normalized across browsers
                    if (code == 13) {
                        event.preventDefault();
                    }

                    if (modalId.prop('id') === $(event.target).prop('id')) {
                        if (contrail.checkIfFunction(keyupAction.onKeyupEnter) && code == 13) {
                            keyupAction.onKeyupEnter();
                        } else if (contrail.checkIfFunction(keyupAction.onKeyupEsc) && code == 27) {
                            keyupAction.onKeyupEsc();
                        }
                    }
                });
            }
        }
    });
})(jQuery);

//Formatting data as an array of strings.
function formatData(data, option) {
    var formattedData = [];
    if (typeof data[0] === 'object') {
        if (typeof option.dataValueField !== 'undefined' && typeof option.dataTextField !== 'undefined') {
            $.each(data, function (key, val) {
                if ('children' in val){
                    formatData(val.children, option);
                }
                data[key][option.dataValueField.apiVar] = val[option.dataValueField.dsVar];
                data[key][option.dataTextField.apiVar] = val[option.dataTextField.dsVar];
            });
        }
    } else {
        $.each(data, function (key, val) {
            formattedData.push({
                id: val,
                value: String(val),
                text: String(val)
            });
        });
        data = formattedData;
    }
    return data;
};

function constructSourceMap(data, fieldName) {
    return traverseMap(typeof data != 'undefined' ? data : [],fieldName,'');
};

function traverseMap(obj, fieldName, parentKey){
    var returnObj = {};
    $.each(obj, function (key, val) {
        returnObj[val[fieldName]] = parentKey + key;
        if('children' in val){
            returnObj = $.extend(returnObj,traverseMap(val.children, fieldName, parentKey + key + '.'));
        }
    });
    return returnObj;
};
function findTextInObj(text, data){
    var found = false;
    for (var i = 0; i < data.length; i++){
        if (data[i].text === text){
            return data[i];
        }
        if('children' in data[i]){
            var found = findTextInObj(text, data[i].children);
            if(found){
                break;
            }
        }
    }
    return found;
};

function  fetchSourceMapData(index, data){
    var arr = index.split("."),
        returnVal = data;

    $.each(arr, function(key, value){
        if('children' in returnVal){
            returnVal = returnVal.children[value];
        } else{
            returnVal = returnVal[value];
        }
    });
    return returnVal;
};

function constructSelect2(self, defaultOption, args) {
    if(typeof args !== 'undefined') {
        self.select2(defaultOption, args);
    } else{
        var option = {
            minimumResultsForSearch : 7,
            dropdownAutoWidth : true,
            dataTextField: 'text',
            dataValueField: 'id',
            data: [],
            query: function (q) {
                if(q.term != null){
                    var pageSize = 50;
                    var results = _.filter(this.data,
                            function(e) {
                              return (q.term == ""  || e.text.toUpperCase().indexOf(q.term.toUpperCase()) >= 0 );
                            });
                    q.callback({results:results.slice((q.page-1)*pageSize, q.page*pageSize),
                                more:results.length >= q.page*pageSize });
                } else {
                    var t = q.term,filtered = { results: [] }, process;
                    process = function(datum, collection) {
                        var group, attr;
                        datum = datum[0];
                        if (datum.children) {
                            group = {};
                            for (attr in datum) {
                                if (datum.hasOwnProperty(attr)) group[attr]=datum[attr];
                            }
                            group.children=[];
                            $(datum.children).each2(function(i, childDatum) { process(childDatum, group.children); });
                            if (group.children.length || query.matcher(t, '', datum)) {
                                collection.push(group);
                            }
                        } else {
                            if (q.matcher(t, '', datum)) {
                                collection.push(datum);
                            }
                        }
                    };
                    if(t != ""){
                        $(this.data).each2(function(i, datum) { process(datum, filtered.results); })
                    }
                    q.callback({results:this.data});
                }
           },
            formatResultCssClass: function(obj){
            	if(obj.label && 'children' in obj){
            		return 'select2-result-label';
            	}
            }

            // Use dropdownCssClass : 'select2-large-width' when initialzing ContrailDropDown
            // to specify width of dropdown for Contrail Dropdown
            // Adding a custom CSS class is also possible. Just add a custom class to the contrail.custom.css file
        }, source = [];
        $.extend(true, option, defaultOption);
        option.dataTextField = {dsVar: option.dataTextField, apiVar: 'text'};
        option.dataValueField = {dsVar: option.dataValueField, apiVar: 'id'};

        var changeFunction = function(e) {
            if (contrail.checkIfFunction(option.change)) {
                option.change(e);
            }
        };
        //subcribe to popup open and close events
        var openFunction = function() {
            if (contrail.checkIfFunction(option.open)) {
                option.open();
            }
        };

        var closeFunction = function() {
            if (contrail.checkIfFunction(option.close)) {
                option.close();
            }
        };

        var selectingFunction = function(e) {
            if (contrail.checkIfFunction(option.selecting)) {
                option.selecting(e);
            }
        };

        if(!$.isEmptyObject(option) && typeof option.dataSource !== 'undefined') {
            if(option.dataSource.type == "remote"){
                var asyncVal = false;
                asyncVal = (option.dataSource.async && option.dataSource.async == true)? true : false;
                var ajaxConfig = {
                        url: option.dataSource.url,
                        async: asyncVal,
                        dataType:'json',
                        success: function(data) {
                            var parsedData = {};
                            if(typeof option.dataSource.parse !== "undefined"){
                                parsedData = option.dataSource.parse(data);
                                source = formatData(parsedData, option);
                            } else{
                                source = formatData(data, option);
                            }
                            if(contrail.checkIfExist(option.dataSource.async) && option.dataSource.async == true ){
                                self.data('contrailDropdown').setData(parsedData,'',true);
                            }
                        }
                    };
                if(option.dataSource.dataType) {
                    ajaxConfig['dataType'] = option.dataSource.dataType;
                }
                if(option.dataSource.timeout) {
                    ajaxConfig['timeout'] = option.dataSource.timeout;
                }
                if(option.dataSource.requestType &&  (option.dataSource.requestType).toLowerCase() == 'post') {
                    ajaxConfig['type'] = 'post';
                    ajaxConfig['contentType'] = "application/json; charset=utf-8";
                    ajaxConfig['data'] = option.dataSource.postData;
                }
                $.ajax(ajaxConfig);

            } else if(option.dataSource.type == "local"){
                source = formatData(option, option.dataSource.data);
            }
            option.data = source;
        }
        if(typeof option.data != "undefined") {
            option.data = formatData(option.data,option);

            if (contrail.checkIfExist(self.data('contrailDropdown'))) {
                self.data('contrailDropdown').destroy();
            }

            if (contrail.checkIfExist(self.data('contrailMultiselect'))) {
                self.data('contrailMultiselect').destroy();
            }

            self.select2(option)
                .off("change", changeFunction)
                .on("change", changeFunction)
                .off("select2-selecting", selectingFunction)
                .on("select2-selecting", selectingFunction)
                .off("select2-open", openFunction)
                .on("select2-open", openFunction)
                .off("select2-close", closeFunction)
                .on("select2-close", closeFunction);

            // set default value only if explicitly defined and if not a multiselect
            if (option.data.length > 0 && contrail.checkIfExist(option.defaultValueId) && option.defaultValueId >= 0 &&
                option.data.length > option.defaultValueId && !contrail.checkIfExist(option.multiple)) {

                var selectedOption = option.data[option.defaultValueId];
                if (option.data[0].children != undefined && option.data[0].children.length > 1) {
                    selectedOption = option.data[0].children[option.defaultValueId];
                }
                var currSelectedVal = self.select2('val');
                if(currSelectedVal == null || currSelectedVal == '') {
                    self.select2('val', selectedOption[option.dataValueField.dsVar], true);
                }
            }
        }

        if(typeof option.data != "undefined") {
            option.sourceMap = constructSourceMap(option.data, 'id');
        }

        return {
            getAllData: function(){
                if(self.data('select2') != null)
                    return self.data('select2').opts.data;
            },
            getSelectedData: function() {
                var selectedValue = self.select2('val'),
                    selectedObjects = [], index;
                if (selectedValue == null) {
                    selectedValue = [];
                } else if (!(selectedValue instanceof Array)) {
                    selectedValue = [selectedValue];
                }
                for(var i = 0; i < selectedValue.length; i++) {
                    index = option.sourceMap[selectedValue[i]];
                    selectedObjects.push(fetchSourceMapData(index, option.data));
                }
                return selectedObjects;
            },
            text: function(text) {
                if(typeof text !== 'undefined') {
                    var data = self.data('select2').opts.data;
                    var answer = findTextInObj(text, data);
                    self.select2('val', answer.id);
                } else {
                    if(self.select2('data') != null && typeof self.select2('data').length !== 'undefined' && self.select2('data').length > 0){
                        var result = [];
                        for(var i=0; i< self.select2('data').length; i++){
                            result.push(self.select2('data')[i].text);
                        }
                        return result;
                    }
                    if (self.select2('data') != null){
                        return (self.select2('data') != null) ? self.select2('data').text : null;
                    }
                }
            },
            value: function(value, triggerChange) {
                if(typeof value === 'undefined'){
                    return self.select2('val');
                }
                else{
                    self.select2('val', value, (contrail.checkIfExist(triggerChange) ? triggerChange : false));
                }
            },
            setData: function(data, value, triggerChange) {
                self.select2('destroy');
                option.data = formatData(data,option);
                if(typeof option.data != "undefined") {
                    option.sourceMap = constructSourceMap(option.data, 'id');
                }

                self.select2(option)
                    .off("change", changeFunction)
                    .on("change", changeFunction);

                if (option.data.length != 0 && contrail.checkIfExist(option.defaultValueId) && option.defaultValueId >= 0 &&
                    option.data.length > option.defaultValueId && !contrail.checkIfExist(option.multiple) &&
                    (value === '' || !contrail.checkIfExist(option.sourceMap[value]))) {
                        self.select2('val', option.data[option.defaultValueId][option.dataValueField.dsVar], (contrail.checkIfExist(triggerChange) ? triggerChange : false));
                }
                //for Hierarchical drpdown
                if(option.data.length != 0 &&
                    option.data[0].children != undefined &&
                    option.data[0].children.length > 1) {
                    self.select2('val',
                        option.data[0].children[1][option.dataValueField.dsVar],
                        (contrail.checkIfExist(triggerChange) ?
                        triggerChange : false));
                }
            },
            enableOptionList: function (flag, disableItemList) {
                for (var j = 0; j < disableItemList.length; j++) {
                    for (var i = 0; i < option.data.length; i++) {
                        if(option.data[i].children === undefined) {
                            if (disableItemList[j] === option.data[i][option.dataValueField.dsVar]) {
                                option.data[i].disabled = !flag;
                            }
                        } else {
                            for(var k = 0;k < option.data[i].children.length; k++) {
                                if(disableItemList[j] === option.data[i].children[k][option.dataValueField.dsVar]) {
                                     option.data[i].children[k].disabled = !flag;
                                }
                            }
                        }
                    }
                }
                self.select2('destroy');
                self.select2(option);
                self.select2('val', "");
            },
            enable: function(flag){
                self.select2("enable", flag);
            },
            isEnabled: function(){
                if($(self.selector).prop('disabled')){
                    return false;
                }else{
                    return true;
                }
            },
            isEnabledOption: function (optionText) {
                for (var i = 0; i < option.data.length; i++) {
                    if (option.data[i].text === optionText) {
                        if (option.data[i].disabled) {
                            return false;
                        }
                    }
                }
                return true;
            },
            destroy: function(){
                self.off("change", changeFunction)
                    .select2('destroy');
            },
            hide: function() {
                self.select2("container").hide();
            },
            show: function() {
                self.select2("container").show();
            }
        };
    }
}

function startWidgetLoading(selectorId) {
    $("#" + selectorId + "-loading").show();
    $("#" + selectorId + "-box").find('a[data-action="collapse"]').hide();
    $("#" + selectorId + "-box").find('a[data-action="settings"]').hide();
};

function endWidgetLoading(selectorId) {
    setTimeout(function(){
        $("#" + selectorId + "-loading").hide();
        $("#" + selectorId + "-box").find('a[data-action="collapse"]').show();
        $("#" + selectorId + "-box").find('a[data-action="settings"]').show();
    },500);
};


  }).apply(root, arguments);
});
}(this));

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

(function(root) {
define("contrail-common", ["jquery"], function() {
  return (function() {
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

    $('.pre-format-JSON2HTML .expander').live('click', function(){
		var selfParent = $(this).parent(),
			jsonObj = {};
		selfParent.children('i').removeClass('icon-plus').removeClass('expander').addClass('icon-minus').addClass('collapser');
		if(selfParent.children('.node').hasClass('raw')){
			jsonObj = JSON.parse(selfParent.children('ul.node').text());
			selfParent.empty().append(formatJsonObject(jsonObj, 2, parseInt(selfParent.children('.node').data('depth')) + 1));
		}
		selfParent.children('.node').show();
		selfParent.children('.collapsed').hide();
    });
    $('.pre-format-JSON2HTML .collapser').live('click', function(){
    	var selfParent = $(this).parent();
    	selfParent.children('i').removeClass('icon-minus').removeClass('collapser').addClass('icon-plus').addClass('expander');
		selfParent.children('.collapsed').show();
		selfParent.children('.node').hide();
	});
    
};

(function($) {
	//Plugin to serializeObject similar to serializeArray.
	$.fn.serializeObject = function() {
	   var o = {};
	   var a = this.serializeArray();
	   $.each(a, function() {
	       if (o[this.name]) {
	           if (!o[this.name].push) {
	               o[this.name] = [o[this.name]];
	           }
	           o[this.name].push(this.value || '');
	       } else {
	           o[this.name] = this.value || '';
	       }
	   });
	   return o;
	};
	
	/*
	 * .addClassSVG(className)
	 * Adds the specified class(es) to each of the set of matched SVG elements.
	 */
	$.fn.addClassSVG = function(className){
		$(this).attr('class', function(index, existingClassNames) {
		    return existingClassNames + ' ' + className;
		});
		return this;
	};
	
	/*
	 * .removeClassSVG(className)
	 * Removes the specified class to each of the set of matched SVG elements.
	 */
	$.fn.removeClassSVG = function(className){
		$(this).attr('class', function(index, existingClassNames) {
    		var re = new RegExp(className, 'g');
    		return existingClassNames.replace(re, '');
    	});
		return this;
	};
	
	/*
	 * .hasClassSVG(className)
	 * Determine whether any of the matched SVG elements are assigned the given class.
	 */
	$.fn.hasClassSVG = function(className){
		var existingClassNames = $(this).attr('class').split(' ');
		return (existingClassNames.indexOf(className) > -1 ? true : false);
	};
	
	/*
	 * .parentsSVG(className)
	 * Get the ancestors of each element in the current set of matched elements or SVG elements, optionally filtered by a selector
	 */
	$.fn.parentsSVG = function(selector){
		var parents = $(this).parents(),
			outputParents = [];
		$.each(parents, function(keyParents, valueParents){
			if($(valueParents).is(selector)){
				outputParents.push(valueParents);
			}
		});
		return outputParents;
	};

    /*
     * .heightSVG(className)
     * Get the current computed height for the first element in the set of matched SVG elements.
     */
    $.fn.heightSVG = function(){
        return ($(this).get(0)) ? $(this).get(0).getBBox().height : null;
    };

    /*
     * .widthSVG(className)
     * Get the current computed width for the first element in the set of matched SVG elements.
     */
    $.fn.widthSVG = function(){
        return ($(this).get(0)) ? $(this).get(0).getBBox().width : null;
    };

    /*
     * .redraw()
     * Redraw or refresh the DOM to reflect the styles configured (Safari hack to render svg elements)
     * */
    $.fn.redraw = function() {
        this.css('display', 'none');
        var temp = this[0].offsetHeight;
        this.css('display', '');
    };
	
})(jQuery);


  }).apply(root, arguments);
});
}(this));

(function(root) {
define("jquery.event.drag", ["jquery"], function() {
  return (function() {
/*! 
 * jquery.event.drag - v 2.2
 * Copyright (c) 2010 Three Dub Media - http://threedubmedia.com
 * Open Source MIT License - http://threedubmedia.com/code/license
 */
// Created: 2008-06-04 
// Updated: 2012-05-21
// REQUIRES: jquery 1.7.x

;(function( $ ){

// add the jquery instance method
$.fn.drag = function( str, arg, opts ){
	// figure out the event type
	var type = typeof str == "string" ? str : "",
	// figure out the event handler...
	fn = $.isFunction( str ) ? str : $.isFunction( arg ) ? arg : null;
	// fix the event type
	if ( type.indexOf("drag") !== 0 ) 
		type = "drag"+ type;
	// were options passed
	opts = ( str == fn ? arg : opts ) || {};
	// trigger or bind event handler
	return fn ? this.bind( type, opts, fn ) : this.trigger( type );
};

// local refs (increase compression)
var $event = $.event, 
$special = $event.special,
// configure the drag special event 
drag = $special.drag = {
	
	// these are the default settings
	defaults: {
		which: 1, // mouse button pressed to start drag sequence
		distance: 0, // distance dragged before dragstart
		not: ':input', // selector to suppress dragging on target elements
		handle: null, // selector to match handle target elements
		relative: false, // true to use "position", false to use "offset"
		drop: true, // false to suppress drop events, true or selector to allow
		click: false // false to suppress click events after dragend (no proxy)
	},
	
	// the key name for stored drag data
	datakey: "dragdata",
	
	// prevent bubbling for better performance
	noBubble: true,
	
	// count bound related events
	add: function( obj ){ 
		// read the interaction data
		var data = $.data( this, drag.datakey ),
		// read any passed options 
		opts = obj.data || {};
		// count another realted event
		data.related += 1;
		// extend data options bound with this event
		// don't iterate "opts" in case it is a node 
		$.each( drag.defaults, function( key, def ){
			if ( opts[ key ] !== undefined )
				data[ key ] = opts[ key ];
		});
	},
	
	// forget unbound related events
	remove: function(){
		$.data( this, drag.datakey ).related -= 1;
	},
	
	// configure interaction, capture settings
	setup: function(){
		// check for related events
		if ( $.data( this, drag.datakey ) ) 
			return;
		// initialize the drag data with copied defaults
		var data = $.extend({ related:0 }, drag.defaults );
		// store the interaction data
		$.data( this, drag.datakey, data );
		// bind the mousedown event, which starts drag interactions
		$event.add( this, "touchstart mousedown", drag.init, data );
		// prevent image dragging in IE...
		if ( this.attachEvent ) 
			this.attachEvent("ondragstart", drag.dontstart ); 
	},
	
	// destroy configured interaction
	teardown: function(){
		var data = $.data( this, drag.datakey ) || {};
		// check for related events
		if ( data.related ) 
			return;
		// remove the stored data
		$.removeData( this, drag.datakey );
		// remove the mousedown event
		$event.remove( this, "touchstart mousedown", drag.init );
		// enable text selection
		drag.textselect( true ); 
		// un-prevent image dragging in IE...
		if ( this.detachEvent ) 
			this.detachEvent("ondragstart", drag.dontstart ); 
	},
		
	// initialize the interaction
	init: function( event ){ 
		// sorry, only one touch at a time
		if ( drag.touched ) 
			return;
		// the drag/drop interaction data
		var dd = event.data, results;
		// check the which directive
		if ( event.which != 0 && dd.which > 0 && event.which != dd.which ) 
			return; 
		// check for suppressed selector
		if ( $( event.target ).is( dd.not ) ) 
			return;
		// check for handle selector
		if ( dd.handle && !$( event.target ).closest( dd.handle, event.currentTarget ).length ) 
			return;

		drag.touched = event.type == 'touchstart' ? this : null;
		dd.propagates = 1;
		dd.mousedown = this;
		dd.interactions = [ drag.interaction( this, dd ) ];
		dd.target = event.target;
		dd.pageX = event.pageX;
		dd.pageY = event.pageY;
		dd.dragging = null;
		// handle draginit event... 
		results = drag.hijack( event, "draginit", dd );
		// early cancel
		if ( !dd.propagates )
			return;
		// flatten the result set
		results = drag.flatten( results );
		// insert new interaction elements
		if ( results && results.length ){
			dd.interactions = [];
			$.each( results, function(){
				dd.interactions.push( drag.interaction( this, dd ) );
			});
		}
		// remember how many interactions are propagating
		dd.propagates = dd.interactions.length;
		// locate and init the drop targets
		if ( dd.drop !== false && $special.drop ) 
			$special.drop.handler( event, dd );
		// disable text selection
		drag.textselect( false ); 
		// bind additional events...
		if ( drag.touched )
			$event.add( drag.touched, "touchmove touchend", drag.handler, dd );
		else 
			$event.add( document, "mousemove mouseup", drag.handler, dd );
		// helps prevent text selection or scrolling
		if ( !drag.touched || dd.live )
			return false;
	},	
	
	// returns an interaction object
	interaction: function( elem, dd ){
		var offset = $( elem )[ dd.relative ? "position" : "offset" ]() || { top:0, left:0 };
		return {
			drag: elem, 
			callback: new drag.callback(), 
			droppable: [],
			offset: offset
		};
	},
	
	// handle drag-releatd DOM events
	handler: function( event ){ 
		// read the data before hijacking anything
		var dd = event.data;	
		// handle various events
		switch ( event.type ){
			// mousemove, check distance, start dragging
			case !dd.dragging && 'touchmove': 
				event.preventDefault();
			case !dd.dragging && 'mousemove':
				//  drag tolerance, x≤ + y≤ = distance≤
				if ( Math.pow(  event.pageX-dd.pageX, 2 ) + Math.pow(  event.pageY-dd.pageY, 2 ) < Math.pow( dd.distance, 2 ) ) 
					break; // distance tolerance not reached
				event.target = dd.target; // force target from "mousedown" event (fix distance issue)
				drag.hijack( event, "dragstart", dd ); // trigger "dragstart"
				if ( dd.propagates ) // "dragstart" not rejected
					dd.dragging = true; // activate interaction
			// mousemove, dragging
			case 'touchmove':
				event.preventDefault();
			case 'mousemove':
				if ( dd.dragging ){
					// trigger "drag"		
					drag.hijack( event, "drag", dd );
					if ( dd.propagates ){
						// manage drop events
						if ( dd.drop !== false && $special.drop )
							$special.drop.handler( event, dd ); // "dropstart", "dropend"							
						break; // "drag" not rejected, stop		
					}
					event.type = "mouseup"; // helps "drop" handler behave
				}
			// mouseup, stop dragging
			case 'touchend': 
			case 'mouseup': 
			default:
				if ( drag.touched )
					$event.remove( drag.touched, "touchmove touchend", drag.handler ); // remove touch events
				else 
					$event.remove( document, "mousemove mouseup", drag.handler ); // remove page events	
				if ( dd.dragging ){
					if ( dd.drop !== false && $special.drop )
						$special.drop.handler( event, dd ); // "drop"
					drag.hijack( event, "dragend", dd ); // trigger "dragend"	
				}
				drag.textselect( true ); // enable text selection
				// if suppressing click events...
				if ( dd.click === false && dd.dragging )
					$.data( dd.mousedown, "suppress.click", new Date().getTime() + 5 );
				dd.dragging = drag.touched = false; // deactivate element	
				break;
		}
	},
		
	// re-use event object for custom events
	hijack: function( event, type, dd, x, elem ){
		// not configured
		if ( !dd ) 
			return;
		// remember the original event and type
		var orig = { event:event.originalEvent, type:event.type },
		// is the event drag related or drog related?
		mode = type.indexOf("drop") ? "drag" : "drop",
		// iteration vars
		result, i = x || 0, ia, $elems, callback,
		len = !isNaN( x ) ? x : dd.interactions.length;
		// modify the event type
		event.type = type;
		// remove the original event
		event.originalEvent = null;
		// initialize the results
		dd.results = [];
		// handle each interacted element
		do if ( ia = dd.interactions[ i ] ){
			// validate the interaction
			if ( type !== "dragend" && ia.cancelled )
				continue;
			// set the dragdrop properties on the event object
			callback = drag.properties( event, dd, ia );
			// prepare for more results
			ia.results = [];
			// handle each element
			$( elem || ia[ mode ] || dd.droppable ).each(function( p, subject ){
				// identify drag or drop targets individually
				callback.target = subject;
				// force propagtion of the custom event
				event.isPropagationStopped = function(){ return false; };
				// handle the event	
				result = subject ? $event.dispatch.call( subject, event, callback ) : null;
				// stop the drag interaction for this element
				if ( result === false ){
					if ( mode == "drag" ){
						ia.cancelled = true;
						dd.propagates -= 1;
					}
					if ( type == "drop" ){
						ia[ mode ][p] = null;
					}
				}
				// assign any dropinit elements
				else if ( type == "dropinit" )
					ia.droppable.push( drag.element( result ) || subject );
				// accept a returned proxy element 
				if ( type == "dragstart" )
					ia.proxy = $( drag.element( result ) || ia.drag )[0];
				// remember this result	
				ia.results.push( result );
				// forget the event result, for recycling
				delete event.result;
				// break on cancelled handler
				if ( type !== "dropinit" )
					return result;
			});	
			// flatten the results	
			dd.results[ i ] = drag.flatten( ia.results );	
			// accept a set of valid drop targets
			if ( type == "dropinit" )
				ia.droppable = drag.flatten( ia.droppable );
			// locate drop targets
			if ( type == "dragstart" && !ia.cancelled )
				callback.update(); 
		}
		while ( ++i < len )
		// restore the original event & type
		event.type = orig.type;
		event.originalEvent = orig.event;
		// return all handler results
		return drag.flatten( dd.results );
	},
		
	// extend the callback object with drag/drop properties...
	properties: function( event, dd, ia ){		
		var obj = ia.callback;
		// elements
		obj.drag = ia.drag;
		obj.proxy = ia.proxy || ia.drag;
		// starting mouse position
		obj.startX = dd.pageX;
		obj.startY = dd.pageY;
		// current distance dragged
		obj.deltaX = event.pageX - dd.pageX;
		obj.deltaY = event.pageY - dd.pageY;
		// original element position
		obj.originalX = ia.offset.left;
		obj.originalY = ia.offset.top;
		// adjusted element position
		obj.offsetX = obj.originalX + obj.deltaX; 
		obj.offsetY = obj.originalY + obj.deltaY;
		// assign the drop targets information
		obj.drop = drag.flatten( ( ia.drop || [] ).slice() );
		obj.available = drag.flatten( ( ia.droppable || [] ).slice() );
		return obj;	
	},
	
	// determine is the argument is an element or jquery instance
	element: function( arg ){
		if ( arg && ( arg.jquery || arg.nodeType == 1 ) )
			return arg;
	},
	
	// flatten nested jquery objects and arrays into a single dimension array
	flatten: function( arr ){
		return $.map( arr, function( member ){
			return member && member.jquery ? $.makeArray( member ) : 
				member && member.length ? drag.flatten( member ) : member;
		});
	},
	
	// toggles text selection attributes ON (true) or OFF (false)
	textselect: function( bool ){ 
		$( document )[ bool ? "unbind" : "bind" ]("selectstart", drag.dontstart )
			.css("MozUserSelect", bool ? "" : "none" );
		// .attr("unselectable", bool ? "off" : "on" )
		document.unselectable = bool ? "off" : "on"; 
	},
	
	// suppress "selectstart" and "ondragstart" events
	dontstart: function(){ 
		return false; 
	},
	
	// a callback instance contructor
	callback: function(){}
	
};

// callback methods
drag.callback.prototype = {
	update: function(){
		if ( $special.drop && this.available.length )
			$.each( this.available, function( i ){
				$special.drop.locate( this, i );
			});
	}
};

// patch $.event.$dispatch to allow suppressing clicks
var $dispatch = $event.dispatch;
$event.dispatch = function( event ){
	if ( $.data( this, "suppress."+ event.type ) - new Date().getTime() > 0 ){
		$.removeData( this, "suppress."+ event.type );
		return;
	}
	return $dispatch.apply( this, arguments );
};

// event fix hooks for touch events...
var touchHooks = 
$event.fixHooks.touchstart = 
$event.fixHooks.touchmove = 
$event.fixHooks.touchend =
$event.fixHooks.touchcancel = {
	props: "clientX clientY pageX pageY screenX screenY".split( " " ),
	filter: function( event, orig ) {
		if ( orig ){
			var touched = ( orig.touches && orig.touches[0] )
				|| ( orig.changedTouches && orig.changedTouches[0] )
				|| null; 
			// iOS webkit: touchstart, touchmove, touchend
			if ( touched ) 
				$.each( touchHooks.props, function( i, prop ){
					event[ prop ] = touched[ prop ];
				});
		}
		return event;
	}
};

// share the same special event configuration with related events...
$special.draginit = $special.dragstart = $special.dragend = drag;

})( jQuery );

  }).apply(root, arguments);
});
}(this));

(function(root) {
define("slick.grid", ["jquery.event.drag"], function() {
  return (function() {
/**
 * @license
 * (c) 2009-2013 Michael Leibman
 * michael{dot}leibman{at}gmail{dot}com
 * http://github.com/mleibman/slickgrid
 *
 * Distributed under MIT license.
 * All rights reserved.
 *
 * SlickGrid v2.2
 *
 * NOTES:
 *     Cell/row DOM manipulations are done directly bypassing jQuery's DOM manipulation methods.
 *     This increases the speed dramatically, but can only be done safely because there are no event handlers
 *     or data associated with any cell/row DOM nodes.  Cell editors must make sure they implement .destroy()
 *     and do proper cleanup.
 */

// make sure required JavaScript modules are loaded
if (typeof jQuery === "undefined") {
  throw "SlickGrid requires jquery module to be loaded";
}
if (!jQuery.fn.drag) {
  throw "SlickGrid requires jquery.event.drag module to be loaded";
}
if (typeof Slick === "undefined") {
  throw "slick.core.js not loaded";
}


(function ($) {
  // Slick.Grid
  $.extend(true, window, {
    Slick: {
      Grid: SlickGrid
    }
  });

  // shared across all grids on the page
  var scrollbarDimensions;
  var maxSupportedCssHeight;  // browser's breaking point

  //////////////////////////////////////////////////////////////////////////////////////////////
  // SlickGrid class implementation (available as Slick.Grid)

  /**
   * Creates a new instance of the grid.
   * @class SlickGrid
   * @constructor
   * @param {Node}              container   Container node to create the grid in.
   * @param {Array,Object}      data        An array of objects for databinding.
   * @param {Array}             columns     An array of column definitions.
   * @param {Object}            options     Grid options.
   **/
  function SlickGrid(container, data, columns, options) {
    // settings
    var defaults = {
      explicitInitialization: false,
      rowHeight: 25,
      defaultColumnWidth: 80,
      enableAddRow: false,
      leaveSpaceForNewRows: false,
      editable: false,
      autoEdit: true,
      enableCellNavigation: true,
      enableColumnReorder: true,
      asyncEditorLoading: false,
      asyncEditorLoadDelay: 100,
      forceFitColumns: false,
      enableAsyncPostRender: false,
      asyncPostRenderDelay: 50,
      autoHeight: false,
      editorLock: Slick.GlobalEditorLock,
      showHeaderRow: false,
      headerRowHeight: 25,
      showTopPanel: false,
      topPanelHeight: 25,
      formatterFactory: null,
      editorFactory: null,
      cellFlashingCssClass: "flashing",
      selectedCellCssClass: "selected",
      multiSelect: true,
      enableTextSelectionOnCells: false,
      dataItemColumnValueExtractor: null,
      fullWidthRows: false,
      multiColumnSort: false,
      defaultFormatter: defaultFormatter,
      forceSyncScrolling: false,
      addNewRowCssClass: "new-row"
    };

    var columnDefaults = {
      name: "",
      resizable: true,
      sortable: false,
      minWidth: 30,
      rerenderOnResize: false,
      headerCssClass: null,
      defaultSortAsc: true,
      focusable: true,
      selectable: true
    };

    // scroller
    var th;   // virtual height
    var h;    // real scrollable height
    var ph;   // page height
    var n;    // number of pages
    var cj;   // "jumpiness" coefficient

    var page = 0;       // current page
    var offset = 0;     // current page offset
    var vScrollDir = 1;

    // private
    var initialized = false;
    var $container;
    var uid = "slickgrid_" + Math.round(1000000 * Math.random());
    var self = this;
    var $focusSink, $focusSink2;
    var $headerScroller;
    var $headers;
    var $headerRow, $headerRowScroller, $headerRowSpacer;
    var $topPanelScroller;
    var $topPanel;
    var $viewport;
    var $canvas;
    var $style;
    var $boundAncestors;
    var stylesheet, columnCssRulesL, columnCssRulesR;
    var viewportH, viewportW;
    var canvasWidth;
    var viewportHasHScroll, viewportHasVScroll;
    var headerColumnWidthDiff = 0, headerColumnHeightDiff = 0, // border+padding
        cellWidthDiff = 0, cellHeightDiff = 0;
    var absoluteColumnMinWidth;

    var tabbingDirection = 1;
    var activePosX;
    var activeRow, activeCell;
    var activeCellNode = null;
    var currentEditor = null;
    var serializedEditorValue;
    var editController;

    var rowsCache = {};
    var renderedRows = 0;
    var numVisibleRows;
    var prevScrollTop = 0;
    var scrollTop = 0;
    var lastRenderedScrollTop = 0;
    var lastRenderedScrollLeft = 0;
    var prevScrollLeft = 0;
    var scrollLeft = 0;

    var selectionModel;
    var selectedRows = [];

    var plugins = [];
    var cellCssClasses = {};

    var columnsById = {};
    var sortColumns = [];
    var columnPosLeft = [];
    var columnPosRight = [];


    // async call handles
    var h_editorLoader = null;
    var h_render = null;
    var h_postrender = null;
    var postProcessedRows = {};
    var postProcessToRow = null;
    var postProcessFromRow = null;

    // perf counters
    var counter_rows_rendered = 0;
    var counter_rows_removed = 0;

    // These two variables work around a bug with inertial scrolling in Webkit/Blink on Mac.
    // See http://crbug.com/312427.
    var rowNodeFromLastMouseWheelEvent;  // this node must not be deleted while inertial scrolling
    var zombieRowNodeFromLastMouseWheelEvent;  // node that was hidden instead of getting deleted


    //////////////////////////////////////////////////////////////////////////////////////////////
    // Initialization

    function init() {
      $container = $(container);
      if ($container.length < 1) {
        throw new Error("SlickGrid requires a valid container, " + container + " does not exist in the DOM.");
      }

      // calculate these only once and share between grid instances
      maxSupportedCssHeight = maxSupportedCssHeight || getMaxSupportedCssHeight();
      scrollbarDimensions = scrollbarDimensions || measureScrollbar();

      options = $.extend({}, defaults, options);
      validateAndEnforceOptions();
      columnDefaults.width = options.defaultColumnWidth;

      columnsById = {};
      for (var i = 0; i < columns.length; i++) {
        var m = columns[i] = $.extend({}, columnDefaults, columns[i]);
        columnsById[m.id] = i;
        if (m.minWidth && m.width < m.minWidth) {
          m.width = m.minWidth;
        }
        if (m.maxWidth && m.width > m.maxWidth) {
          m.width = m.maxWidth;
        }
      }

      // validate loaded JavaScript modules against requested options
      if (options.enableColumnReorder && !$.fn.sortable) {
        throw new Error("SlickGrid's 'enableColumnReorder = true' option requires jquery-ui.sortable module to be loaded");
      }

      editController = {
        "commitCurrentEdit": commitCurrentEdit,
        "cancelCurrentEdit": cancelCurrentEdit
      };

      $container
          .empty()
          .css("overflow", "hidden")
          .css("outline", 0)
          .addClass(uid)
          .addClass("ui-widget");

      // set up a positioning container if needed
      if (!/relative|absolute|fixed/.test($container.css("position"))) {
        $container.css("position", "relative");
      }

      $focusSink = $("<div tabIndex='0' hideFocus style='position:fixed;width:0;height:0;top:0;left:0;outline:0;'></div>").appendTo($container);

      $headerScroller = $("<div class='slick-header ui-state-default' style='overflow:hidden;position:relative;' />").appendTo($container);
      $headers = $("<div class='slick-header-columns' style='left:-1000px' />").appendTo($headerScroller);
      $headers.width(getHeadersWidth());

      $headerRowScroller = $("<div class='slick-headerrow ui-state-default' style='overflow:hidden;position:relative;' />").appendTo($container);
      $headerRow = $("<div class='slick-headerrow-columns' />").appendTo($headerRowScroller);
      $headerRowSpacer = $("<div style='display:block;height:1px;position:absolute;top:0;left:0;'></div>")
          .css("width", getCanvasWidth() + scrollbarDimensions.width + "px")
          .appendTo($headerRowScroller);

      $topPanelScroller = $("<div class='slick-top-panel-scroller ui-state-default' style='overflow:hidden;position:relative;' />").appendTo($container);
      $topPanel = $("<div class='slick-top-panel' style='width:10000px' />").appendTo($topPanelScroller);

      if (!options.showTopPanel) {
        $topPanelScroller.hide();
      }

      if (!options.showHeaderRow) {
        $headerRowScroller.hide();
      }

      $viewport = $("<div class='slick-viewport' style='width:100%;overflow:auto;outline:0;position:relative;;'>").appendTo($container);
      $viewport.css("overflow-y", options.autoHeight ? "hidden" : "auto");

      $canvas = $("<div class='grid-canvas' />").appendTo($viewport);

      $focusSink2 = $focusSink.clone().appendTo($container);

      if (!options.explicitInitialization) {
        finishInitialization();
      }
    }

    function finishInitialization() {
      if (!initialized) {
        initialized = true;

        viewportW = parseFloat($.css($container[0], "width", true));

        // header columns and cells may have different padding/border skewing width calculations (box-sizing, hello?)
        // calculate the diff so we can set consistent sizes
        measureCellPaddingAndBorder();

        // for usability reasons, all text selection in SlickGrid is disabled
        // with the exception of input and textarea elements (selection must
        // be enabled there so that editors work as expected); note that
        // selection in grid cells (grid body) is already unavailable in
        // all browsers except IE
        disableSelection($headers); // disable all text selection in header (including input and textarea)

        if (!options.enableTextSelectionOnCells) {
          // disable text selection in grid cells except in input and textarea elements
          // (this is IE-specific, because selectstart event will only fire in IE)
          $viewport.bind("selectstart.ui", function (event) {
            return $(event.target).is("input,textarea");
          });
        }

        updateColumnCaches();
        createColumnHeaders();
        setupColumnSort();
        createCssRules();
        resizeCanvas();
        bindAncestorScrollEvents();

        $container
            .bind("resize.slickgrid", resizeCanvas);
        $viewport
            //.bind("click", handleClick)
            .bind("scroll", handleScroll);
        $headerScroller
            .bind("contextmenu", handleHeaderContextMenu)
            .bind("click", handleHeaderClick)
            .delegate(".slick-header-column", "mouseenter", handleHeaderMouseEnter)
            .delegate(".slick-header-column", "mouseleave", handleHeaderMouseLeave);
        $headerRowScroller
            .bind("scroll", handleHeaderRowScroll);
        $focusSink.add($focusSink2)
            .bind("keydown", handleKeyDown);
        $canvas
            .bind("keydown", handleKeyDown)
            .bind("click", handleClick)
            .bind("dblclick", handleDblClick)
            .bind("contextmenu", handleContextMenu)
            .bind("draginit", handleDragInit)
            .bind("dragstart", {distance: 3}, handleDragStart)
            .bind("drag", handleDrag)
            .bind("dragend", handleDragEnd)
            .delegate(".slick-cell", "mouseenter", handleMouseEnter)
            .delegate(".slick-cell", "mouseleave", handleMouseLeave);

        // Work around http://crbug.com/312427.
        if (navigator.userAgent.toLowerCase().match(/webkit/) &&
            navigator.userAgent.toLowerCase().match(/macintosh/)) {
          $canvas.bind("mousewheel", handleMouseWheel);
        }
      }
    }

    function registerPlugin(plugin) {
      plugins.unshift(plugin);
      plugin.init(self);
    }

    function unregisterPlugin(plugin) {
      for (var i = plugins.length; i >= 0; i--) {
        if (plugins[i] === plugin) {
          if (plugins[i].destroy) {
            plugins[i].destroy();
          }
          plugins.splice(i, 1);
          break;
        }
      }
    }

    function setSelectionModel(model) {
      if (selectionModel) {
        selectionModel.onSelectedRangesChanged.unsubscribe(handleSelectedRangesChanged);
        if (selectionModel.destroy) {
          selectionModel.destroy();
        }
      }

      selectionModel = model;
      if (selectionModel) {
        selectionModel.init(self);
        selectionModel.onSelectedRangesChanged.subscribe(handleSelectedRangesChanged);
      }
    }

    function getSelectionModel() {
      return selectionModel;
    }

    function getCanvasNode() {
      return $canvas[0];
    }

    function measureScrollbar() {
      var $c = $("<div style='position:absolute; top:-10000px; left:-10000px; width:100px; height:100px; overflow:scroll;'></div>").appendTo("body");
      var dim = {
        width: $c.width() - $c[0].clientWidth,
        height: $c.height() - $c[0].clientHeight
      };
      $c.remove();
      return dim;
    }

    function getHeadersWidth() {
      var headersWidth = 0;
      for (var i = 0, ii = columns.length; i < ii; i++) {
        var width = columns[i].width;
        headersWidth += width;
      }
      headersWidth += scrollbarDimensions.width;
      return Math.max(headersWidth, viewportW) + 1000;
    }

    function getCanvasWidth() {
      var availableWidth = viewportHasVScroll ? viewportW - scrollbarDimensions.width : viewportW;
      var rowWidth = 0;
      var i = columns.length;
      while (i--) {
        rowWidth += columns[i].width;
      }
      return options.fullWidthRows ? Math.max(rowWidth, availableWidth) : rowWidth;
    }

    function updateCanvasWidth(forceColumnWidthsUpdate) {
      var oldCanvasWidth = canvasWidth;
      canvasWidth = getCanvasWidth();

      if (canvasWidth != oldCanvasWidth) {
        $canvas.width(canvasWidth);
        $headerRow.width(canvasWidth);
        $headers.width(getHeadersWidth());
        viewportHasHScroll = (canvasWidth > viewportW - scrollbarDimensions.width);
      }

      $headerRowSpacer.width(canvasWidth + (viewportHasVScroll ? scrollbarDimensions.width : 0));

      if (canvasWidth != oldCanvasWidth || forceColumnWidthsUpdate) {
        applyColumnWidths();
      }
    }

    function disableSelection($target) {
      if ($target && $target.jquery) {
        $target
            .attr("unselectable", "on")
            .css("MozUserSelect", "none")
            .bind("selectstart.ui", function () {
              return false;
            }); // from jquery:ui.core.js 1.7.2
      }
    }

    function getMaxSupportedCssHeight() {
      var supportedHeight = 1000000;
      // FF reports the height back but still renders blank after ~6M px
      var testUpTo = navigator.userAgent.toLowerCase().match(/firefox/) ? 6000000 : 1000000000;
      var div = $("<div style='display:none' />").appendTo(document.body);

      while (true) {
        var test = supportedHeight * 2;
        div.css("height", test);
        if (test > testUpTo || div.height() !== test) {
          break;
        } else {
          supportedHeight = test;
        }
      }

      div.remove();
      return supportedHeight;
    }

    // TODO:  this is static.  need to handle page mutation.
    function bindAncestorScrollEvents() {
      var elem = $canvas[0];
      while ((elem = elem.parentNode) != document.body && elem != null) {
        // bind to scroll containers only
        if (elem == $viewport[0] || elem.scrollWidth != elem.clientWidth || elem.scrollHeight != elem.clientHeight) {
          var $elem = $(elem);
          if (!$boundAncestors) {
            $boundAncestors = $elem;
          } else {
            $boundAncestors = $boundAncestors.add($elem);
          }
          $elem.bind("scroll." + uid, handleActiveCellPositionChange);
        }
      }
    }

    function unbindAncestorScrollEvents() {
      if (!$boundAncestors) {
        return;
      }
      $boundAncestors.unbind("scroll." + uid);
      $boundAncestors = null;
    }

    function updateColumnHeader(columnId, title, toolTip) {
      if (!initialized) { return; }
      var idx = getColumnIndex(columnId);
      if (idx == null) {
        return;
      }

      var columnDef = columns[idx];
      var $header = $headers.children().eq(idx);
      if ($header) {
        if (title !== undefined) {
          columns[idx].name = title;
        }
        if (toolTip !== undefined) {
          columns[idx].toolTip = toolTip;
        }

        trigger(self.onBeforeHeaderCellDestroy, {
          "node": $header[0],
          "column": columnDef
        });

        $header
            .attr("title", toolTip || "")
            .children().eq(0).html(title);

        trigger(self.onHeaderCellRendered, {
          "node": $header[0],
          "column": columnDef
        });
      }
    }

    function getHeaderRow() {
      return $headerRow[0];
    }

    function getHeaderRowColumn(columnId) {
      var idx = getColumnIndex(columnId);
      var $header = $headerRow.children().eq(idx);
      return $header && $header[0];
    }

    function createColumnHeaders() {
      function onMouseEnter() {
        $(this).addClass("ui-state-hover");
      }

      function onMouseLeave() {
        $(this).removeClass("ui-state-hover");
      }

      $headers.find(".slick-header-column")
        .each(function() {
          var columnDef = $(this).data("column");
          if (columnDef) {
            trigger(self.onBeforeHeaderCellDestroy, {
              "node": this,
              "column": columnDef
            });
          }
        });
      $headers.empty();
      $headers.width(getHeadersWidth());

      $headerRow.find(".slick-headerrow-column")
        .each(function() {
          var columnDef = $(this).data("column");
          if (columnDef) {
            trigger(self.onBeforeHeaderRowCellDestroy, {
              "node": this,
              "column": columnDef
            });
          }
        });
      $headerRow.empty();

      for (var i = 0; i < columns.length; i++) {
        var m = columns[i];

        var header = $("<div class='ui-state-default slick-header-column' />")
            .html("<span class='slick-column-name'>" + m.name + "</span>")
            .width(m.width - headerColumnWidthDiff)
            .attr("id", "" + uid + m.id)
            .attr("title", m.toolTip || "")
            .data("column", m)
            .addClass(m.headerCssClass || "")
            .appendTo($headers);

        if (options.enableColumnReorder || m.sortable) {
          header
            .on('mouseenter', onMouseEnter)
            .on('mouseleave', onMouseLeave);
        }

        if (m.sortable) {
          header.addClass("slick-header-sortable");
          header.append("<span class='slick-sort-indicator' />");
        }

        trigger(self.onHeaderCellRendered, {
          "node": header[0],
          "column": m
        });

        if (options.showHeaderRow) {
          var headerRowCell = $("<div class='ui-state-default slick-headerrow-column l" + i + " r" + i + "'></div>")
              .data("column", m)
              .appendTo($headerRow);

          trigger(self.onHeaderRowCellRendered, {
            "node": headerRowCell[0],
            "column": m
          });
        }
      }

      setSortColumns(sortColumns);
      setupColumnResize();
      if (options.enableColumnReorder) {
        setupColumnReorder();
      }
    }

    function setupColumnSort() {
      $headers.click(function (e) {
        // temporary workaround for a bug in jQuery 1.7.1 (http://bugs.jquery.com/ticket/11328)
        e.metaKey = e.metaKey || e.ctrlKey;

        if ($(e.target).hasClass("slick-resizable-handle")) {
          return;
        }

        var $col = $(e.target).closest(".slick-header-column");
        if (!$col.length) {
          return;
        }

        var column = $col.data("column");
        if (column.sortable) {
          if (!getEditorLock().commitCurrentEdit()) {
            return;
          }

          var sortOpts = null;
          var i = 0;
          for (; i < sortColumns.length; i++) {
            if (sortColumns[i].columnId == column.id) {
              sortOpts = sortColumns[i];
              sortOpts.sortAsc = !sortOpts.sortAsc;
              break;
            }
          }

          if (e.metaKey && options.multiColumnSort) {
            if (sortOpts) {
              sortColumns.splice(i, 1);
            }
          }
          else {
            if ((!e.shiftKey && !e.metaKey) || !options.multiColumnSort) {
              sortColumns = [];
            }

            if (!sortOpts) {
              sortOpts = { columnId: column.id, sortAsc: column.defaultSortAsc };
              sortColumns.push(sortOpts);
            } else if (sortColumns.length == 0) {
              sortColumns.push(sortOpts);
            }
          }

          setSortColumns(sortColumns);

          if (!options.multiColumnSort) {
            trigger(self.onSort, {
              multiColumnSort: false,
              sortCol: column,
              sortAsc: sortOpts.sortAsc}, e);
          } else {
            trigger(self.onSort, {
              multiColumnSort: true,
              sortCols: $.map(sortColumns, function(col) {
                return {sortCol: columns[getColumnIndex(col.columnId)], sortAsc: col.sortAsc };
              })}, e);
          }
        }
      });
    }

    function setupColumnReorder() {
      $headers.filter(":ui-sortable").sortable("destroy");
      $headers.sortable({
        containment: "parent",
        distance: 3,
        axis: "x",
        cursor: "default",
        tolerance: "intersection",
        helper: "clone",
        placeholder: "slick-sortable-placeholder ui-state-default slick-header-column",
        start: function (e, ui) {
          ui.placeholder.width(ui.helper.outerWidth() - headerColumnWidthDiff);
          $(ui.helper).addClass("slick-header-column-active");
        },
        beforeStop: function (e, ui) {
          $(ui.helper).removeClass("slick-header-column-active");
        },
        stop: function (e) {
          if (!getEditorLock().commitCurrentEdit()) {
            $(this).sortable("cancel");
            return;
          }

          var reorderedIds = $headers.sortable("toArray");
          var reorderedColumns = [];
          for (var i = 0; i < reorderedIds.length; i++) {
            reorderedColumns.push(columns[getColumnIndex(reorderedIds[i].replace(uid, ""))]);
          }
          setColumns(reorderedColumns);

          trigger(self.onColumnsReordered, {});
          e.stopPropagation();
          setupColumnResize();
        }
      });
    }

    function setupColumnResize() {
      var $col, j, c, pageX, columnElements, minPageX, maxPageX, firstResizable, lastResizable;
      columnElements = $headers.children();
      columnElements.find(".slick-resizable-handle").remove();
      columnElements.each(function (i, e) {
        if (columns[i].resizable) {
          if (firstResizable === undefined) {
            firstResizable = i;
          }
          lastResizable = i;
        }
      });
      if (firstResizable === undefined) {
        return;
      }
      columnElements.each(function (i, e) {
        if (i < firstResizable || (options.forceFitColumns && i >= lastResizable)) {
          return;
        }
        $col = $(e);
        $("<div class='slick-resizable-handle' />")
            .appendTo(e)
            .bind("dragstart", function (e, dd) {
              if (!getEditorLock().commitCurrentEdit()) {
                return false;
              }
              pageX = e.pageX;
              $(this).parent().addClass("slick-header-column-active");
              var shrinkLeewayOnRight = null, stretchLeewayOnRight = null;
              // lock each column's width option to current width
              columnElements.each(function (i, e) {
                columns[i].previousWidth = $(e).outerWidth();
              });
              if (options.forceFitColumns) {
                shrinkLeewayOnRight = 0;
                stretchLeewayOnRight = 0;
                // colums on right affect maxPageX/minPageX
                for (j = i + 1; j < columnElements.length; j++) {
                  c = columns[j];
                  if (c.resizable) {
                    if (stretchLeewayOnRight !== null) {
                      if (c.maxWidth) {
                        stretchLeewayOnRight += c.maxWidth - c.previousWidth;
                      } else {
                        stretchLeewayOnRight = null;
                      }
                    }
                    shrinkLeewayOnRight += c.previousWidth - Math.max(c.minWidth || 0, absoluteColumnMinWidth);
                  }
                }
              }
              var shrinkLeewayOnLeft = 0, stretchLeewayOnLeft = 0;
              for (j = 0; j <= i; j++) {
                // columns on left only affect minPageX
                c = columns[j];
                if (c.resizable) {
                  if (stretchLeewayOnLeft !== null) {
                    if (c.maxWidth) {
                      stretchLeewayOnLeft += c.maxWidth - c.previousWidth;
                    } else {
                      stretchLeewayOnLeft = null;
                    }
                  }
                  shrinkLeewayOnLeft += c.previousWidth - Math.max(c.minWidth || 0, absoluteColumnMinWidth);
                }
              }
              if (shrinkLeewayOnRight === null) {
                shrinkLeewayOnRight = 100000;
              }
              if (shrinkLeewayOnLeft === null) {
                shrinkLeewayOnLeft = 100000;
              }
              if (stretchLeewayOnRight === null) {
                stretchLeewayOnRight = 100000;
              }
              if (stretchLeewayOnLeft === null) {
                stretchLeewayOnLeft = 100000;
              }
              maxPageX = pageX + Math.min(shrinkLeewayOnRight, stretchLeewayOnLeft);
              minPageX = pageX - Math.min(shrinkLeewayOnLeft, stretchLeewayOnRight);
            })
            .bind("drag", function (e, dd) {
              var actualMinWidth, d = Math.min(maxPageX, Math.max(minPageX, e.pageX)) - pageX, x;
              if (d < 0) { // shrink column
                x = d;
                for (j = i; j >= 0; j--) {
                  c = columns[j];
                  if (c.resizable) {
                    actualMinWidth = Math.max(c.minWidth || 0, absoluteColumnMinWidth);
                    if (x && c.previousWidth + x < actualMinWidth) {
                      x += c.previousWidth - actualMinWidth;
                      c.width = actualMinWidth;
                    } else {
                      c.width = c.previousWidth + x;
                      x = 0;
                    }
                  }
                }

                if (options.forceFitColumns) {
                  x = -d;
                  for (j = i + 1; j < columnElements.length; j++) {
                    c = columns[j];
                    if (c.resizable) {
                      if (x && c.maxWidth && (c.maxWidth - c.previousWidth < x)) {
                        x -= c.maxWidth - c.previousWidth;
                        c.width = c.maxWidth;
                      } else {
                        c.width = c.previousWidth + x;
                        x = 0;
                      }
                    }
                  }
                }
              } else { // stretch column
                x = d;
                for (j = i; j >= 0; j--) {
                  c = columns[j];
                  if (c.resizable) {
                    if (x && c.maxWidth && (c.maxWidth - c.previousWidth < x)) {
                      x -= c.maxWidth - c.previousWidth;
                      c.width = c.maxWidth;
                    } else {
                      c.width = c.previousWidth + x;
                      x = 0;
                    }
                  }
                }

                if (options.forceFitColumns) {
                  x = -d;
                  for (j = i + 1; j < columnElements.length; j++) {
                    c = columns[j];
                    if (c.resizable) {
                      actualMinWidth = Math.max(c.minWidth || 0, absoluteColumnMinWidth);
                      if (x && c.previousWidth + x < actualMinWidth) {
                        x += c.previousWidth - actualMinWidth;
                        c.width = actualMinWidth;
                      } else {
                        c.width = c.previousWidth + x;
                        x = 0;
                      }
                    }
                  }
                }
              }
              applyColumnHeaderWidths();
              if (options.syncColumnCellResize) {
                applyColumnWidths();
              }
            })
            .bind("dragend", function (e, dd) {
              var newWidth;
              $(this).parent().removeClass("slick-header-column-active");
              for (j = 0; j < columnElements.length; j++) {
                c = columns[j];
                newWidth = $(columnElements[j]).outerWidth();

                if (c.previousWidth !== newWidth && c.rerenderOnResize) {
                  invalidateAllRows();
                }
              }
              updateCanvasWidth(true);
              render();
              trigger(self.onColumnsResized, {});
            });
      });
    }

    function getVBoxDelta($el) {
      var p = ["borderTopWidth", "borderBottomWidth", "paddingTop", "paddingBottom"];
      var delta = 0;
      $.each(p, function (n, val) {
        delta += parseFloat($el.css(val)) || 0;
      });
      return delta;
    }

    function measureCellPaddingAndBorder() {
      var el;
      var h = ["borderLeftWidth", "borderRightWidth", "paddingLeft", "paddingRight"];
      var v = ["borderTopWidth", "borderBottomWidth", "paddingTop", "paddingBottom"];

      el = $("<div class='ui-state-default slick-header-column' style='visibility:hidden'>-</div>").appendTo($headers);
      headerColumnWidthDiff = headerColumnHeightDiff = 0;
      if (el.css("box-sizing") != "border-box" && el.css("-moz-box-sizing") != "border-box" && el.css("-webkit-box-sizing") != "border-box") {
        $.each(h, function (n, val) {
          headerColumnWidthDiff += parseFloat(el.css(val)) || 0;
        });
        $.each(v, function (n, val) {
          headerColumnHeightDiff += parseFloat(el.css(val)) || 0;
        });
      }
      el.remove();

      var r = $("<div class='slick-row' />").appendTo($canvas);
      el = $("<div class='slick-cell' id='' style='visibility:hidden'>-</div>").appendTo(r);
      cellWidthDiff = cellHeightDiff = 0;
      if (el.css("box-sizing") != "border-box" && el.css("-moz-box-sizing") != "border-box" && el.css("-webkit-box-sizing") != "border-box") {
        $.each(h, function (n, val) {
          cellWidthDiff += parseFloat(el.css(val)) || 0;
        });
        $.each(v, function (n, val) {
          cellHeightDiff += parseFloat(el.css(val)) || 0;
        });
      }
      r.remove();

      absoluteColumnMinWidth = Math.max(headerColumnWidthDiff, cellWidthDiff);
    }

    function createCssRules() {
      $style = $("<style type='text/css' rel='stylesheet' />").appendTo($("head"));
      var rowHeight = (options.rowHeight - cellHeightDiff);
      var rules = [
        "." + uid + " .slick-header-column { left: 1000px; }",
        "." + uid + " .slick-top-panel { height:" + options.topPanelHeight + "px; }",
        "." + uid + " .slick-headerrow-columns { height:" + options.headerRowHeight + "px; }",
//        "." + uid + " .slick-cell { height:" + rowHeight + "px; }",
        "." + uid + " .slick-row { height:" + options.rowHeight + "px; }"
      ];

      for (var i = 0; i < columns.length; i++) {
        rules.push("." + uid + " .l" + i + " { }");
        rules.push("." + uid + " .r" + i + " { }");
      }

      if ($style[0].styleSheet) { // IE
        $style[0].styleSheet.cssText = rules.join(" ");
      } else {
        $style[0].appendChild(document.createTextNode(rules.join(" ")));
      }
    }

    function getColumnCssRules(idx) {
      if (!stylesheet) {
        var sheets = document.styleSheets;
        for (var i = 0; i < sheets.length; i++) {
          if ((sheets[i].ownerNode || sheets[i].owningElement) == $style[0]) {
            stylesheet = sheets[i];
            break;
          }
        }

        if (!stylesheet) {
          throw new Error("Cannot find stylesheet.");
        }

        // find and cache column CSS rules
        columnCssRulesL = [];
        columnCssRulesR = [];
        var cssRules = (stylesheet.cssRules || stylesheet.rules);
        var matches, columnIdx;
        for (var i = 0; i < cssRules.length; i++) {
          var selector = cssRules[i].selectorText;
          if (matches = /\.l\d+/.exec(selector)) {
            columnIdx = parseInt(matches[0].substr(2, matches[0].length - 2), 10);
            columnCssRulesL[columnIdx] = cssRules[i];
          } else if (matches = /\.r\d+/.exec(selector)) {
            columnIdx = parseInt(matches[0].substr(2, matches[0].length - 2), 10);
            columnCssRulesR[columnIdx] = cssRules[i];
          }
        }
      }

      return {
        "left": columnCssRulesL[idx],
        "right": columnCssRulesR[idx]
      };
    }

    function removeCssRules() {
      $style.remove();
      stylesheet = null;
    }

    function destroy() {
      getEditorLock().cancelCurrentEdit();

      trigger(self.onBeforeDestroy, {});

      var i = plugins.length;
      while(i--) {
        unregisterPlugin(plugins[i]);
      }

      if (options.enableColumnReorder) {
          $headers.filter(":ui-sortable").sortable("destroy");
      }

      unbindAncestorScrollEvents();
      $container.unbind(".slickgrid");
      removeCssRules();

      $canvas.unbind("draginit dragstart dragend drag");
      $container.empty().removeClass(uid);
    }


    //////////////////////////////////////////////////////////////////////////////////////////////
    // General

    function trigger(evt, args, e) {
      e = e || new Slick.EventData();
      args = args || {};
      args.grid = self;
      return evt.notify(args, e, self);
    }

    function getEditorLock() {
      return options.editorLock;
    }

    function getEditController() {
      return editController;
    }

    function getColumnIndex(id) {
      return columnsById[id];
    }

    function autosizeColumns() {
      var i, c,
          widths = [],
          shrinkLeeway = 0,
          total = 0,
          prevTotal,
          availWidth = viewportHasVScroll ? viewportW - scrollbarDimensions.width : viewportW;

      for (i = 0; i < columns.length; i++) {
        c = columns[i];
        widths.push(c.width);
        total += c.width;
        if (c.resizable) {
          shrinkLeeway += c.width - Math.max(c.minWidth, absoluteColumnMinWidth);
        }
      }

      // shrink
      prevTotal = total;
      while (total > availWidth && shrinkLeeway) {
        var shrinkProportion = (total - availWidth) / shrinkLeeway;
        for (i = 0; i < columns.length && total > availWidth; i++) {
          c = columns[i];
          var width = widths[i];
          if (!c.resizable || width <= c.minWidth || width <= absoluteColumnMinWidth) {
            continue;
          }
          var absMinWidth = Math.max(c.minWidth, absoluteColumnMinWidth);
          var shrinkSize = Math.floor(shrinkProportion * (width - absMinWidth)) || 1;
          shrinkSize = Math.min(shrinkSize, width - absMinWidth);
          total -= shrinkSize;
          shrinkLeeway -= shrinkSize;
          widths[i] -= shrinkSize;
        }
        if (prevTotal <= total) {  // avoid infinite loop
          break;
        }
        prevTotal = total;
      }

      // grow
      prevTotal = total;
      while (total < availWidth) {
        var growProportion = availWidth / total;
        for (i = 0; i < columns.length && total < availWidth; i++) {
          c = columns[i];
          var currentWidth = widths[i];
          var growSize;

          if (!c.resizable || c.maxWidth <= currentWidth) {
            growSize = 0;
          } else {
            growSize = Math.min(Math.floor(growProportion * currentWidth) - currentWidth, (c.maxWidth - currentWidth) || 1000000) || 1;
          }
          total += growSize;
          widths[i] += growSize;
        }
        if (prevTotal >= total) {  // avoid infinite loop
          break;
        }
        prevTotal = total;
      }

      var reRender = false;
      for (i = 0; i < columns.length; i++) {
        if (columns[i].rerenderOnResize && columns[i].width != widths[i]) {
          reRender = true;
        }
        columns[i].width = widths[i];
      }

      applyColumnHeaderWidths();
      updateCanvasWidth(true);
      if (reRender) {
        invalidateAllRows();
        render();
      }
    }

    function applyColumnHeaderWidths() {
      if (!initialized) { return; }
      var h;
      for (var i = 0, headers = $headers.children(), ii = headers.length; i < ii; i++) {
        h = $(headers[i]);
        if (h.width() !== columns[i].width - headerColumnWidthDiff) {
          h.width(columns[i].width - headerColumnWidthDiff);
        }
      }

      updateColumnCaches();
    }

    function applyColumnWidths() {
      var x = 0, w, rule;
      for (var i = 0; i < columns.length; i++) {
        w = columns[i].width;

        rule = getColumnCssRules(i);
        rule.left.style.left = x + "px";
        rule.right.style.right = (canvasWidth - x - w) + "px";

        x += columns[i].width;
      }
    }

    function setSortColumn(columnId, ascending) {
      setSortColumns([{ columnId: columnId, sortAsc: ascending}]);
    }

    function setSortColumns(cols) {
      sortColumns = cols;

      var headerColumnEls = $headers.children();
      headerColumnEls
          .removeClass("slick-header-column-sorted")
          .find(".slick-sort-indicator")
              .removeClass("slick-sort-indicator-asc slick-sort-indicator-desc");

      $.each(sortColumns, function(i, col) {
        if (col.sortAsc == null) {
          col.sortAsc = true;
        }
        var columnIndex = getColumnIndex(col.columnId);
        if (columnIndex != null) {
          headerColumnEls.eq(columnIndex)
              .addClass("slick-header-column-sorted")
              .find(".slick-sort-indicator")
                  .addClass(col.sortAsc ? "slick-sort-indicator-asc" : "slick-sort-indicator-desc");
        }
      });
    }

    function getSortColumns() {
      return sortColumns;
    }

    function handleSelectedRangesChanged(e, ranges) {
      selectedRows = [];
      var hash = {};
      for (var i = 0; i < ranges.length; i++) {
        for (var j = ranges[i].fromRow; j <= ranges[i].toRow; j++) {
          if (!hash[j]) {  // prevent duplicates
            selectedRows.push(j);
            hash[j] = {};
          }
          for (var k = ranges[i].fromCell; k <= ranges[i].toCell; k++) {
            if (canCellBeSelected(j, k)) {
              hash[j][columns[k].id] = options.selectedCellCssClass;
            }
          }
        }
      }

      setCellCssStyles(options.selectedCellCssClass, hash);

      trigger(self.onSelectedRowsChanged, {rows: getSelectedRows()}, e);
    }

    function getColumns() {
      return columns;
    }

    function updateColumnCaches() {
      // Pre-calculate cell boundaries.
      columnPosLeft = [];
      columnPosRight = [];
      var x = 0;
      for (var i = 0, ii = columns.length; i < ii; i++) {
        columnPosLeft[i] = x;
        columnPosRight[i] = x + columns[i].width;
        x += columns[i].width;
      }
    }

    function setColumns(columnDefinitions) {
      columns = columnDefinitions;

      columnsById = {};
      for (var i = 0; i < columns.length; i++) {
        var m = columns[i] = $.extend({}, columnDefaults, columns[i]);
        columnsById[m.id] = i;
        if (m.minWidth && m.width < m.minWidth) {
          m.width = m.minWidth;
        }
        if (m.maxWidth && m.width > m.maxWidth) {
          m.width = m.maxWidth;
        }
      }

      updateColumnCaches();

      if (initialized) {
        invalidateAllRows();
        createColumnHeaders();
        removeCssRules();
        createCssRules();
        resizeCanvas();
        applyColumnWidths();
        handleScroll();
      }
    }

    function getOptions() {
      return options;
    }

    function setOptions(args) {
      if (!getEditorLock().commitCurrentEdit()) {
        return;
      }

      makeActiveCellNormal();

      if (options.enableAddRow !== args.enableAddRow) {
        invalidateRow(getDataLength());
      }

      options = $.extend(options, args);
      validateAndEnforceOptions();

      $viewport.css("overflow-y", options.autoHeight ? "hidden" : "auto");
      render();
    }

    function validateAndEnforceOptions() {
      if (options.autoHeight) {
        options.leaveSpaceForNewRows = false;
      }
    }

    function setData(newData, scrollToTop) {
      data = newData;
      invalidateAllRows();
      updateRowCount();
      if (scrollToTop) {
        scrollTo(0);
      }
    }

    function getData() {
      return data;
    }

    function getDataLength() {
      if (data.getLength) {
        return data.getLength();
      } else {
        return data.length;
      }
    }

    function getDataLengthIncludingAddNew() {
      return getDataLength() + (options.enableAddRow ? 1 : 0);
    }

    function getDataItem(i) {
      if (data.getItem) {
        return data.getItem(i);
      } else {
        return data[i];
      }
    }

    function getTopPanel() {
      return $topPanel[0];
    }

    function setTopPanelVisibility(visible) {
      if (options.showTopPanel != visible) {
        options.showTopPanel = visible;
        if (visible) {
          $topPanelScroller.slideDown("fast", resizeCanvas);
        } else {
          $topPanelScroller.slideUp("fast", resizeCanvas);
        }
      }
    }

    function setHeaderRowVisibility(visible) {
      if (options.showHeaderRow != visible) {
        options.showHeaderRow = visible;
        if (visible) {
          $headerRowScroller.slideDown("fast", resizeCanvas);
        } else {
          $headerRowScroller.slideUp("fast", resizeCanvas);
        }
      }
    }

    function getContainerNode() {
      return $container.get(0);
    }

    //////////////////////////////////////////////////////////////////////////////////////////////
    // Rendering / Scrolling

    function getRowTop(row) {
      return options.rowHeight * row - offset;
    }

    function getRowFromPosition(y) {
      return Math.floor((y + offset) / options.rowHeight);
    }

    function scrollTo(y) {
      y = Math.max(y, 0);
      y = Math.min(y, th - viewportH + (viewportHasHScroll ? scrollbarDimensions.height : 0));

      var oldOffset = offset;

      page = Math.min(n - 1, Math.floor(y / ph));
      offset = Math.round(page * cj);
      var newScrollTop = y - offset;

      if (offset != oldOffset) {
        var range = getVisibleRange(newScrollTop);
        cleanupRows(range);
        updateRowPositions();
      }

      if (prevScrollTop != newScrollTop) {
        vScrollDir = (prevScrollTop + oldOffset < newScrollTop + offset) ? 1 : -1;
        $viewport[0].scrollTop = (lastRenderedScrollTop = scrollTop = prevScrollTop = newScrollTop);

        trigger(self.onViewportChanged, {});
      }
    }

    function defaultFormatter(row, cell, value, columnDef, dataContext) {
      if (value == null) {
        return "";
      } else {
        return (value + "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
      }
    }

    function getFormatter(row, column) {
      var rowMetadata = data.getItemMetadata && data.getItemMetadata(row);

      // look up by id, then index
      var columnOverrides = rowMetadata &&
          rowMetadata.columns &&
          (rowMetadata.columns[column.id] || rowMetadata.columns[getColumnIndex(column.id)]);

      return (columnOverrides && columnOverrides.formatter) ||
          (rowMetadata && rowMetadata.formatter) ||
          column.formatter ||
          (options.formatterFactory && options.formatterFactory.getFormatter(column)) ||
          options.defaultFormatter;
    }

    function getEditor(row, cell) {
      var column = columns[cell];
      var rowMetadata = data.getItemMetadata && data.getItemMetadata(row);
      var columnMetadata = rowMetadata && rowMetadata.columns;

      if (columnMetadata && columnMetadata[column.id] && columnMetadata[column.id].editor !== undefined) {
        return columnMetadata[column.id].editor;
      }
      if (columnMetadata && columnMetadata[cell] && columnMetadata[cell].editor !== undefined) {
        return columnMetadata[cell].editor;
      }

      return column.editor || (options.editorFactory && options.editorFactory.getEditor(column));
    }

    function getDataItemValueForColumn(item, columnDef) {
      if (options.dataItemColumnValueExtractor) {
        return options.dataItemColumnValueExtractor(item, columnDef);
      }
      return item[columnDef.field];
    }

    function appendRowHtml(stringArray, row, range, dataLength) {
      var d = getDataItem(row);
      var dataLoading = row < dataLength && !d;
      var rowCss = "slick-row" +
          (dataLoading ? " loading" : "") +
          (row === activeRow ? " active" : "") +
          (row % 2 == 1 ? " odd" : " even");

      if (!d) {
        rowCss += " " + options.addNewRowCssClass;
      }

      var metadata = data.getItemMetadata && data.getItemMetadata(row);

      if (metadata && metadata.cssClasses) {
        rowCss += " " + metadata.cssClasses;
      }

      stringArray.push("<div class='ui-widget-content " + rowCss + " slick-row-master slick_row_" + ((d) ? d.cgrid : '') + "' data-cgrid='" + ((d) ? d.cgrid : '') + "'>");

      var colspan, m;
      for (var i = 0, ii = columns.length; i < ii; i++) {
        m = columns[i];
        colspan = 1;
        if (metadata && metadata.columns) {
          var columnData = metadata.columns[m.id] || metadata.columns[i];
          colspan = (columnData && columnData.colspan) || 1;
          if (colspan === "*") {
            colspan = ii - i;
          }
        }

        // Do not render cells outside of the viewport.
        if (columnPosRight[Math.min(ii - 1, i + colspan - 1)] > range.leftPx) {
          if (columnPosLeft[i] > range.rightPx) {
            // All columns to the right are outside the range.
            break;
          }

          appendCellHtml(stringArray, row, i, colspan, d);
        }

        if (colspan > 1) {
          i += (colspan - 1);
        }
      }

      stringArray.push("</div>");
    }

    function appendCellHtml(stringArray, row, cell, colspan, item) {
      var m = columns[cell];
      var cellCss = "slick-cell l" + cell + " r" + Math.min(columns.length - 1, cell + colspan - 1) +
          (m.cssClass ? " " + m.cssClass : "");
      if (row === activeRow && cell === activeCell) {
        cellCss += (" active");
      }

      // TODO:  merge them together in the setter
      for (var key in cellCssClasses) {
        if (cellCssClasses[key][row] && cellCssClasses[key][row][m.id]) {
          cellCss += (" " + cellCssClasses[key][row][m.id]);
        }
      }

      stringArray.push("<div class='" + cellCss + "'>");

      // if there is a corresponding row (if not, this is the Add New row or this data hasn't been loaded yet)
      if (item) {
        var value = getDataItemValueForColumn(item, m);
        stringArray.push(getFormatter(row, m)(row, cell, value, m, item));
      }

      stringArray.push("</div>");

      rowsCache[row].cellRenderQueue.push(cell);
      rowsCache[row].cellColSpans[cell] = colspan;
    }


    function cleanupRows(rangeToKeep) {
      for (var i in rowsCache) {
        if (((i = parseInt(i, 10)) !== activeRow) && (i < rangeToKeep.top || i > rangeToKeep.bottom)) {
          removeRowFromCache(i);
        }
      }
    }

    function invalidate() {
      updateRowCount();
      invalidateAllRows();
      render();
    }

    function invalidateAllRows() {
      if (currentEditor) {
        makeActiveCellNormal();
      }
      for (var row in rowsCache) {
        removeRowFromCache(row);
      }
    }

    function removeRowFromCache(row) {
      var cacheEntry = rowsCache[row];
      if (!cacheEntry) {
        return;
      }

      if (rowNodeFromLastMouseWheelEvent == cacheEntry.rowNode) {
        cacheEntry.rowNode.style.display = 'none';
        zombieRowNodeFromLastMouseWheelEvent = rowNodeFromLastMouseWheelEvent;
      } else {
        $canvas[0].removeChild(cacheEntry.rowNode);
      }
      
      delete rowsCache[row];
      delete postProcessedRows[row];
      renderedRows--;
      counter_rows_removed++;
    }

    function invalidateRows(rows) {
      var i, rl;
      if (!rows || !rows.length) {
        return;
      }
      vScrollDir = 0;
      for (i = 0, rl = rows.length; i < rl; i++) {
        if (currentEditor && activeRow === rows[i]) {
          makeActiveCellNormal();
        }
        if (rowsCache[rows[i]]) {
          removeRowFromCache(rows[i]);
        }
      }
    }

    function invalidateRow(row) {
      invalidateRows([row]);
    }

    function updateCell(row, cell) {
      var cellNode = getCellNode(row, cell);
      if (!cellNode) {
        return;
      }

      var m = columns[cell], d = getDataItem(row);
      if (currentEditor && activeRow === row && activeCell === cell) {
        currentEditor.loadValue(d);
      } else {
        cellNode.innerHTML = d ? getFormatter(row, m)(row, cell, getDataItemValueForColumn(d, m), m, d) : "";
        invalidatePostProcessingResults(row);
      }
    }

    function updateRow(row) {
      var cacheEntry = rowsCache[row];
      if (!cacheEntry) {
        return;
      }

      ensureCellNodesInRowsCache(row);

      var d = getDataItem(row);

      for (var columnIdx in cacheEntry.cellNodesByColumnIdx) {
        if (!cacheEntry.cellNodesByColumnIdx.hasOwnProperty(columnIdx)) {
          continue;
        }

        columnIdx = columnIdx | 0;
        var m = columns[columnIdx],
            node = cacheEntry.cellNodesByColumnIdx[columnIdx];

        if (row === activeRow && columnIdx === activeCell && currentEditor) {
          currentEditor.loadValue(d);
        } else if (d) {
          node.innerHTML = getFormatter(row, m)(row, columnIdx, getDataItemValueForColumn(d, m), m, d);
        } else {
          node.innerHTML = "";
        }
      }

      invalidatePostProcessingResults(row);
    }

    function getViewportHeight() {
      return parseFloat($.css($container[0], "height", true)) -
          parseFloat($.css($container[0], "paddingTop", true)) -
          parseFloat($.css($container[0], "paddingBottom", true)) -
          parseFloat($.css($headerScroller[0], "height")) - getVBoxDelta($headerScroller) -
          (options.showTopPanel ? options.topPanelHeight + getVBoxDelta($topPanelScroller) : 0) -
          (options.showHeaderRow ? options.headerRowHeight + getVBoxDelta($headerRowScroller) : 0);
    }

    function resizeCanvas() {
      if (!initialized) { return; }
      if (options.autoHeight) {
        viewportH = options.rowHeight * getDataLengthIncludingAddNew();
      } else {
        viewportH = getViewportHeight();
      }

      numVisibleRows = Math.ceil(viewportH / options.rowHeight);
      viewportW = parseFloat($.css($container[0], "width", true));
      if (!options.autoHeight) {
        $viewport.height(viewportH);
      }

      if (options.forceFitColumns) {
        autosizeColumns();
      }

      updateRowCount();
      handleScroll();
      // Since the width has changed, force the render() to reevaluate virtually rendered cells.
      lastRenderedScrollLeft = -1;
      render();
    }

    function updateRowCount() {
      if (!initialized) { return; }

      var dataLengthIncludingAddNew = getDataLengthIncludingAddNew();
      var numberOfRows = dataLengthIncludingAddNew +
          (options.leaveSpaceForNewRows ? numVisibleRows - 1 : 0);

      var oldViewportHasVScroll = viewportHasVScroll;
      // with autoHeight, we do not need to accommodate the vertical scroll bar
      viewportHasVScroll = !options.autoHeight && (numberOfRows * options.rowHeight > viewportH);

      makeActiveCellNormal();

      // remove the rows that are now outside of the data range
      // this helps avoid redundant calls to .removeRow() when the size of the data decreased by thousands of rows
      var l = dataLengthIncludingAddNew - 1;
      for (var i in rowsCache) {
        if (i >= l) {
          removeRowFromCache(i);
        }
      }

      if (activeCellNode && activeRow > l) {
        resetActiveCell();
      }

      var oldH = h;
      th = Math.max(options.rowHeight * numberOfRows, viewportH - scrollbarDimensions.height);
      if (th < maxSupportedCssHeight) {
        // just one page
        h = ph = th;
        n = 1;
        cj = 0;
      } else {
        // break into pages
        h = maxSupportedCssHeight;
        ph = h / 100;
        n = Math.floor(th / ph);
        cj = (th - h) / (n - 1);
      }

      if (h !== oldH) {
//        $canvas.css("height", h);
        scrollTop = $viewport[0].scrollTop;
      }

      var oldScrollTopInRange = (scrollTop + offset <= th - viewportH);

      if (th == 0 || scrollTop == 0) {
        page = offset = 0;
      } else if (oldScrollTopInRange) {
        // maintain virtual position
        scrollTo(scrollTop + offset);
      } else {
        // scroll to bottom
        scrollTo(th - viewportH);
      }

      if (h != oldH && options.autoHeight) {
        resizeCanvas();
      }

      if (options.forceFitColumns && oldViewportHasVScroll != viewportHasVScroll) {
        autosizeColumns();
      }
      updateCanvasWidth(false);
    }

    function getVisibleRange(viewportTop, viewportLeft) {
      if (viewportTop == null) {
        viewportTop = scrollTop;
      }
      if (viewportLeft == null) {
        viewportLeft = scrollLeft;
      }

      return {
        top: getRowFromPosition(viewportTop),
        bottom: getRowFromPosition(viewportTop + viewportH) + 1,
        leftPx: viewportLeft,
        rightPx: viewportLeft + viewportW
      };
    }

    function getRenderedRange(viewportTop, viewportLeft) {
      var range = getVisibleRange(viewportTop, viewportLeft);
      var buffer = Math.round(viewportH / options.rowHeight);
      var minBuffer = 3;

      if (vScrollDir == -1) {
        range.top -= buffer;
        range.bottom += minBuffer;
      } else if (vScrollDir == 1) {
        range.top -= minBuffer;
        range.bottom += buffer;
      } else {
        range.top -= minBuffer;
        range.bottom += minBuffer;
      }

      range.top = Math.max(0, range.top);
      range.bottom = Math.min(getDataLengthIncludingAddNew() - 1, range.bottom);

      range.leftPx -= viewportW;
      range.rightPx += viewportW;

      range.leftPx = Math.max(0, range.leftPx);
      range.rightPx = Math.min(canvasWidth, range.rightPx);

      return range;
    }

    function ensureCellNodesInRowsCache(row) {
      var cacheEntry = rowsCache[row];
      if (cacheEntry) {
        if (cacheEntry.cellRenderQueue.length) {
          var lastChild = cacheEntry.rowNode.lastChild;
          while (cacheEntry.cellRenderQueue.length) {
            var columnIdx = cacheEntry.cellRenderQueue.pop();
            cacheEntry.cellNodesByColumnIdx[columnIdx] = lastChild;
            lastChild = lastChild.previousSibling;
          }
        }
      }
    }

    function cleanUpCells(range, row) {
      var totalCellsRemoved = 0;
      var cacheEntry = rowsCache[row];

      // Remove cells outside the range.
      var cellsToRemove = [];
      for (var i in cacheEntry.cellNodesByColumnIdx) {
        // I really hate it when people mess with Array.prototype.
        if (!cacheEntry.cellNodesByColumnIdx.hasOwnProperty(i)) {
          continue;
        }

        // This is a string, so it needs to be cast back to a number.
        i = i | 0;

        var colspan = cacheEntry.cellColSpans[i];
        if (columnPosLeft[i] > range.rightPx ||
          columnPosRight[Math.min(columns.length - 1, i + colspan - 1)] < range.leftPx) {
          if (!(row == activeRow && i == activeCell)) {
            cellsToRemove.push(i);
          }
        }
      }

      var cellToRemove;
      while ((cellToRemove = cellsToRemove.pop()) != null) {
        cacheEntry.rowNode.removeChild(cacheEntry.cellNodesByColumnIdx[cellToRemove]);
        delete cacheEntry.cellColSpans[cellToRemove];
        delete cacheEntry.cellNodesByColumnIdx[cellToRemove];
        if (postProcessedRows[row]) {
          delete postProcessedRows[row][cellToRemove];
        }
        totalCellsRemoved++;
      }
    }

    function cleanUpAndRenderCells(range) {
      var cacheEntry;
      var stringArray = [];
      var processedRows = [];
      var cellsAdded;
      var totalCellsAdded = 0;
      var colspan;

      for (var row = range.top, btm = range.bottom; row <= btm; row++) {
        cacheEntry = rowsCache[row];
        if (!cacheEntry) {
          continue;
        }

        // cellRenderQueue populated in renderRows() needs to be cleared first
        ensureCellNodesInRowsCache(row);

        cleanUpCells(range, row);

        // Render missing cells.
        cellsAdded = 0;

        var metadata = data.getItemMetadata && data.getItemMetadata(row);
        metadata = metadata && metadata.columns;

        var d = getDataItem(row);

        // TODO:  shorten this loop (index? heuristics? binary search?)
        for (var i = 0, ii = columns.length; i < ii; i++) {
          // Cells to the right are outside the range.
          if (columnPosLeft[i] > range.rightPx) {
            break;
          }

          // Already rendered.
          if ((colspan = cacheEntry.cellColSpans[i]) != null) {
            i += (colspan > 1 ? colspan - 1 : 0);
            continue;
          }

          colspan = 1;
          if (metadata) {
            var columnData = metadata[columns[i].id] || metadata[i];
            colspan = (columnData && columnData.colspan) || 1;
            if (colspan === "*") {
              colspan = ii - i;
            }
          }

          if (columnPosRight[Math.min(ii - 1, i + colspan - 1)] > range.leftPx) {
            appendCellHtml(stringArray, row, i, colspan, d);
            cellsAdded++;
          }

          i += (colspan > 1 ? colspan - 1 : 0);
        }

        if (cellsAdded) {
          totalCellsAdded += cellsAdded;
          processedRows.push(row);
        }
      }

      if (!stringArray.length) {
        return;
      }

      var x = document.createElement("div");
      x.innerHTML = stringArray.join("");

      var processedRow;
      var node;
      while ((processedRow = processedRows.pop()) != null) {
        cacheEntry = rowsCache[processedRow];
        var columnIdx;
        while ((columnIdx = cacheEntry.cellRenderQueue.pop()) != null) {
          node = x.lastChild;
          cacheEntry.rowNode.appendChild(node);
          cacheEntry.cellNodesByColumnIdx[columnIdx] = node;
        }
      }
    }

    function renderRows(range) {
      var parentNode = $canvas[0],
          stringArray = [],
          rows = [],
          needToReselectCell = false,
          dataLength = getDataLength();

      for (var i = range.top, ii = range.bottom; i <= ii; i++) {
        if (rowsCache[i]) {
          continue;
        }
        renderedRows++;
        rows.push(i);

        // Create an entry right away so that appendRowHtml() can
        // start populatating it.
        rowsCache[i] = {
          "rowNode": null,

          // ColSpans of rendered cells (by column idx).
          // Can also be used for checking whether a cell has been rendered.
          "cellColSpans": [],

          // Cell nodes (by column idx).  Lazy-populated by ensureCellNodesInRowsCache().
          "cellNodesByColumnIdx": [],

          // Column indices of cell nodes that have been rendered, but not yet indexed in
          // cellNodesByColumnIdx.  These are in the same order as cell nodes added at the
          // end of the row.
          "cellRenderQueue": []
        };

        appendRowHtml(stringArray, i, range, dataLength);
        if (activeCellNode && activeRow === i) {
          needToReselectCell = true;
        }
        counter_rows_rendered++;
      }

      if (!rows.length) { return; }

      var x = document.createElement("div");
      x.innerHTML = stringArray.join("");

      for (var i = 0, ii = rows.length; i < ii; i++) {
        rowsCache[rows[i]].rowNode = parentNode.appendChild(x.firstChild);
      }

      if (needToReselectCell) {
        activeCellNode = getCellNode(activeRow, activeCell);
      }
    }

    function startPostProcessing() {
      if (!options.enableAsyncPostRender) {
        return;
      }
      clearTimeout(h_postrender);
      h_postrender = setTimeout(asyncPostProcessRows, options.asyncPostRenderDelay);
    }

    function invalidatePostProcessingResults(row) {
      delete postProcessedRows[row];
      postProcessFromRow = Math.min(postProcessFromRow, row);
      postProcessToRow = Math.max(postProcessToRow, row);
      startPostProcessing();
    }

    function updateRowPositions() {
      for (var row in rowsCache) {
        rowsCache[row].rowNode.style.top = getRowTop(row) + "px";
      }
    }

    function render() {
      if (!initialized) { return; }
      var visible = getVisibleRange();
      var rendered = getRenderedRange();

      // remove rows no longer in the viewport
      cleanupRows(rendered);

      // add new rows & missing cells in existing rows
      if (lastRenderedScrollLeft != scrollLeft) {
        cleanUpAndRenderCells(rendered);
      }

      // render missing rows
      renderRows(rendered);

      postProcessFromRow = visible.top;
      postProcessToRow = Math.min(getDataLengthIncludingAddNew() - 1, visible.bottom);
      startPostProcessing();

      lastRenderedScrollTop = scrollTop;
      lastRenderedScrollLeft = scrollLeft;
      h_render = null;
    }

    function handleHeaderRowScroll() {
      var scrollLeft = $headerRowScroller[0].scrollLeft;
      if (scrollLeft != $viewport[0].scrollLeft) {
        $viewport[0].scrollLeft = scrollLeft;
      }
    }

    function handleScroll() {
      scrollTop = $viewport[0].scrollTop;
      scrollLeft = $viewport[0].scrollLeft;
      var vScrollDist = Math.abs(scrollTop - prevScrollTop);
      var hScrollDist = Math.abs(scrollLeft - prevScrollLeft);

      if (hScrollDist) {
        prevScrollLeft = scrollLeft;
        $headerScroller[0].scrollLeft = scrollLeft;
        $topPanelScroller[0].scrollLeft = scrollLeft;
        $headerRowScroller[0].scrollLeft = scrollLeft;
      }

      if (vScrollDist) {
        vScrollDir = prevScrollTop < scrollTop ? 1 : -1;
        prevScrollTop = scrollTop;

        // switch virtual pages if needed
        if (vScrollDist < viewportH) {
          scrollTo(scrollTop + offset);
        } else {
          var oldOffset = offset;
          if (h == viewportH) {
            page = 0;
          } else {
            page = Math.min(n - 1, Math.floor(scrollTop * ((th - viewportH) / (h - viewportH)) * (1 / ph)));
          }
          offset = Math.round(page * cj);
          if (oldOffset != offset) {
            invalidateAllRows();
          }
        }
      }

      if (hScrollDist || vScrollDist) {
        if (h_render) {
          clearTimeout(h_render);
        }

        if (Math.abs(lastRenderedScrollTop - scrollTop) > 20 ||
            Math.abs(lastRenderedScrollLeft - scrollLeft) > 20) {
          if (options.forceSyncScrolling || (
              Math.abs(lastRenderedScrollTop - scrollTop) < viewportH &&
              Math.abs(lastRenderedScrollLeft - scrollLeft) < viewportW)) {
            render();
          } else {
            h_render = setTimeout(render, 50);
          }

          trigger(self.onViewportChanged, {});
        }
      }

      trigger(self.onScroll, {scrollLeft: scrollLeft, scrollTop: scrollTop});
    }

    function asyncPostProcessRows() {
      var dataLength = getDataLength();
      while (postProcessFromRow <= postProcessToRow) {
        var row = (vScrollDir >= 0) ? postProcessFromRow++ : postProcessToRow--;
        var cacheEntry = rowsCache[row];
        if (!cacheEntry || row >= dataLength) {
          continue;
        }

        if (!postProcessedRows[row]) {
          postProcessedRows[row] = {};
        }

        ensureCellNodesInRowsCache(row);
        for (var columnIdx in cacheEntry.cellNodesByColumnIdx) {
          if (!cacheEntry.cellNodesByColumnIdx.hasOwnProperty(columnIdx)) {
            continue;
          }

          columnIdx = columnIdx | 0;

          var m = columns[columnIdx];
          if (m.asyncPostRender && !postProcessedRows[row][columnIdx]) {
            var node = cacheEntry.cellNodesByColumnIdx[columnIdx];
            if (node) {
              m.asyncPostRender(node, row, getDataItem(row), m);
            }
            postProcessedRows[row][columnIdx] = true;
          }
        }

        h_postrender = setTimeout(asyncPostProcessRows, options.asyncPostRenderDelay);
        return;
      }
    }

    function updateCellCssStylesOnRenderedRows(addedHash, removedHash) {
      var node, columnId, addedRowHash, removedRowHash;
      for (var row in rowsCache) {
        removedRowHash = removedHash && removedHash[row];
        addedRowHash = addedHash && addedHash[row];

        if (removedRowHash) {
          for (columnId in removedRowHash) {
            if (!addedRowHash || removedRowHash[columnId] != addedRowHash[columnId]) {
              node = getCellNode(row, getColumnIndex(columnId));
              if (node) {
                $(node).removeClass(removedRowHash[columnId]);
              }
            }
          }
        }

        if (addedRowHash) {
          for (columnId in addedRowHash) {
            if (!removedRowHash || removedRowHash[columnId] != addedRowHash[columnId]) {
              node = getCellNode(row, getColumnIndex(columnId));
              if (node) {
                $(node).addClass(addedRowHash[columnId]);
              }
            }
          }
        }
      }
    }

    function addCellCssStyles(key, hash) {
      if (cellCssClasses[key]) {
        throw "addCellCssStyles: cell CSS hash with key '" + key + "' already exists.";
      }

      cellCssClasses[key] = hash;
      updateCellCssStylesOnRenderedRows(hash, null);

      trigger(self.onCellCssStylesChanged, { "key": key, "hash": hash });
    }

    function removeCellCssStyles(key) {
      if (!cellCssClasses[key]) {
        return;
      }

      updateCellCssStylesOnRenderedRows(null, cellCssClasses[key]);
      delete cellCssClasses[key];

      trigger(self.onCellCssStylesChanged, { "key": key, "hash": null });
    }

    function setCellCssStyles(key, hash) {
      var prevHash = cellCssClasses[key];

      cellCssClasses[key] = hash;
      updateCellCssStylesOnRenderedRows(hash, prevHash);

      trigger(self.onCellCssStylesChanged, { "key": key, "hash": hash });
    }

    function getCellCssStyles(key) {
      return cellCssClasses[key];
    }

    function flashCell(row, cell, speed) {
      speed = speed || 100;
      if (rowsCache[row]) {
        var $cell = $(getCellNode(row, cell));

        function toggleCellClass(times) {
          if (!times) {
            return;
          }
          setTimeout(function () {
                $cell.queue(function () {
                  $cell.toggleClass(options.cellFlashingCssClass).dequeue();
                  toggleCellClass(times - 1);
                });
              },
              speed);
        }

        toggleCellClass(4);
      }
    }

    //////////////////////////////////////////////////////////////////////////////////////////////
    // Interactivity

    function handleMouseWheel(e) {
      var rowNode = $(e.target).closest(".slick-row")[0];
      if (rowNode != rowNodeFromLastMouseWheelEvent) {
        if (zombieRowNodeFromLastMouseWheelEvent && zombieRowNodeFromLastMouseWheelEvent != rowNode) {
          $canvas[0].removeChild(zombieRowNodeFromLastMouseWheelEvent);
          zombieRowNodeFromLastMouseWheelEvent = null;
        }
        rowNodeFromLastMouseWheelEvent = rowNode;      
      }
    }

    function handleDragInit(e, dd) {
      var cell = getCellFromEvent(e);
      if (!cell || !cellExists(cell.row, cell.cell)) {
        return false;
      }

      var retval = trigger(self.onDragInit, dd, e);
      if (e.isImmediatePropagationStopped()) {
        return retval;
      }

      // if nobody claims to be handling drag'n'drop by stopping immediate propagation,
      // cancel out of it
      return false;
    }

    function handleDragStart(e, dd) {
      var cell = getCellFromEvent(e);
      if (!cell || !cellExists(cell.row, cell.cell)) {
        return false;
      }

      var retval = trigger(self.onDragStart, dd, e);
      if (e.isImmediatePropagationStopped()) {
        return retval;
      }

      return false;
    }

    function handleDrag(e, dd) {
      return trigger(self.onDrag, dd, e);
    }

    function handleDragEnd(e, dd) {
      trigger(self.onDragEnd, dd, e);
    }

    function handleKeyDown(e) {
      trigger(self.onKeyDown, {row: activeRow, cell: activeCell}, e);
      var handled = e.isImmediatePropagationStopped();

      if (!handled) {
        if (!e.shiftKey && !e.altKey && !e.ctrlKey) {
          if (e.which == 27) {
            if (!getEditorLock().isActive()) {
              return; // no editing mode to cancel, allow bubbling and default processing (exit without cancelling the event)
            }
            cancelEditAndSetFocus();
          } else if (e.which == 34) {
            navigatePageDown();
            handled = true;           
          } else if (e.which == 33) {
            navigatePageUp();
            handled = true;
          } else if (e.which == 37) {
            handled = navigateLeft();
          } else if (e.which == 39) {
            handled = navigateRight();
          } else if (e.which == 38) {
            handled = navigateUp();
          } else if (e.which == 40) {
            handled = navigateDown();
          } else if (e.which == 9) {
            handled = navigateNext();
          } else if (e.which == 13) {
            if (options.editable) {
              if (currentEditor) {
                // adding new row
                if (activeRow === getDataLength()) {
                  navigateDown();
                } else {
                  commitEditAndSetFocus();
                }
              } else {
                if (getEditorLock().commitCurrentEdit()) {
                  makeActiveCellEditable();
                }
              }
            }
            handled = true;
          }
        } else if (e.which == 9 && e.shiftKey && !e.ctrlKey && !e.altKey) {
          handled = navigatePrev();
        }
      }

      if (handled) {
        // the event has been handled so don't let parent element (bubbling/propagation) or browser (default) handle it
        e.stopPropagation();
        e.preventDefault();
        try {
          e.originalEvent.keyCode = 0; // prevent default behaviour for special keys in IE browsers (F3, F5, etc.)
        }
        // ignore exceptions - setting the original event's keycode throws access denied exception for "Ctrl"
        // (hitting control key only, nothing else), "Shift" (maybe others)
        catch (error) {
        }
      }
    }

    function handleClick(e) {
      if (!currentEditor) {
        // if this click resulted in some cell child node getting focus,
        // don't steal it back - keyboard events will still bubble up
        // IE9+ seems to default DIVs to tabIndex=0 instead of -1, so check for cell clicks directly.
        if (options.editable && (e.target != document.activeElement || $(e.target).hasClass("slick-cell"))) {
          setFocus();
        }
      }

      var cell = getCellFromEvent(e);
      if (!cell || (currentEditor !== null && activeRow == cell.row && activeCell == cell.cell)) {
        return;
      }

      trigger(self.onClick, {row: cell.row, cell: cell.cell}, e);
      if (e.isImmediatePropagationStopped()) {
        return;
      }

      if ((activeCell != cell.cell || activeRow != cell.row) && canCellBeActive(cell.row, cell.cell)) {
        if (!getEditorLock().isActive() || getEditorLock().commitCurrentEdit()) {
          scrollRowIntoView(cell.row, false);
          setActiveCellInternal(getCellNode(cell.row, cell.cell));
        }
      }
    }

    function handleContextMenu(e) {
      var $cell = $(e.target).closest(".slick-cell", $canvas);
      if ($cell.length === 0) {
        return;
      }

      // are we editing this cell?
      if (activeCellNode === $cell[0] && currentEditor !== null) {
        return;
      }

      trigger(self.onContextMenu, {}, e);
    }

    function handleDblClick(e) {
      var cell = getCellFromEvent(e);
      if (!cell || (currentEditor !== null && activeRow == cell.row && activeCell == cell.cell)) {
        return;
      }

      trigger(self.onDblClick, {row: cell.row, cell: cell.cell}, e);
      if (e.isImmediatePropagationStopped()) {
        return;
      }

      if (options.editable) {
        gotoCell(cell.row, cell.cell, true);
      }
    }

    function handleHeaderMouseEnter(e) {
      trigger(self.onHeaderMouseEnter, {
        "column": $(this).data("column")
      }, e);
    }

    function handleHeaderMouseLeave(e) {
      trigger(self.onHeaderMouseLeave, {
        "column": $(this).data("column")
      }, e);
    }

    function handleHeaderContextMenu(e) {
      var $header = $(e.target).closest(".slick-header-column", ".slick-header-columns");
      var column = $header && $header.data("column");
      trigger(self.onHeaderContextMenu, {column: column}, e);
    }

    function handleHeaderClick(e) {
      var $header = $(e.target).closest(".slick-header-column", ".slick-header-columns");
      var column = $header && $header.data("column");
      if (column) {
        trigger(self.onHeaderClick, {column: column}, e);
      }
    }

    function handleMouseEnter(e) {
        /* Added onclick onMousEnter for editors to get displayed */
        var cell = getCellFromEvent(e);
        if (options.editable) {
            gotoCell(cell.row, cell.cell, true);
        }
        trigger(self.onMouseEnter, {}, e);
    }

    function handleMouseLeave(e) {
      trigger(self.onMouseLeave, {}, e);
    }

    function cellExists(row, cell) {
      return !(row < 0 || row >= getDataLength() || cell < 0 || cell >= columns.length);
    }

    function getCellFromPoint(x, y) {
      var row = getRowFromPosition(y);
      var cell = 0;

      var w = 0;
      for (var i = 0; i < columns.length && w < x; i++) {
        w += columns[i].width;
        cell++;
      }

      if (cell < 0) {
        cell = 0;
      }

      return {row: row, cell: cell - 1};
    }

    function getCellFromNode(cellNode) {
      // read column number from .l<columnNumber> CSS class
      var cls = /l\d+/.exec(cellNode.className);
      if (!cls) {
        throw "getCellFromNode: cannot get cell - " + cellNode.className;
      }
      return parseInt(cls[0].substr(1, cls[0].length - 1), 10);
    }

    function getRowFromNode(rowNode) {
      for (var row in rowsCache) {
        if (rowsCache[row].rowNode === rowNode) {
          return row | 0;
        }
      }

      return null;
    }

    function getCellFromEvent(e) {
      var $cell = $(e.target).closest(".slick-cell", $canvas);
      if (!$cell.length) {
        return null;
      }

      var row = getRowFromNode($cell[0].parentNode);
      var cell = getCellFromNode($cell[0]);

      if (row == null || cell == null) {
        return null;
      } else {
        return {
          "row": row,
          "cell": cell
        };
      }
    }

    function getCellNodeBox(row, cell) {
      if (!cellExists(row, cell)) {
        return null;
      }

      var y1 = getRowTop(row);
      var y2 = y1 + options.rowHeight - 1;
      var x1 = 0;
      for (var i = 0; i < cell; i++) {
        x1 += columns[i].width;
      }
      var x2 = x1 + columns[cell].width;

      return {
        top: y1,
        left: x1,
        bottom: y2,
        right: x2
      };
    }

    //////////////////////////////////////////////////////////////////////////////////////////////
    // Cell switching

    function resetActiveCell() {
      setActiveCellInternal(null, false);
    }

    function setFocus() {
      if (tabbingDirection == -1) {
        $focusSink[0].focus();
      } else {
        $focusSink2[0].focus();
      }
    }

    function scrollCellIntoView(row, cell, doPaging) {
      scrollRowIntoView(row, doPaging);

      var colspan = getColspan(row, cell);
      var left = columnPosLeft[cell],
        right = columnPosRight[cell + (colspan > 1 ? colspan - 1 : 0)],
        scrollRight = scrollLeft + viewportW;

      if (left < scrollLeft) {
        $viewport.scrollLeft(left);
        handleScroll();
        render();
      } else if (right > scrollRight) {
        $viewport.scrollLeft(Math.min(left, right - $viewport[0].clientWidth));
        handleScroll();
        render();
      }
    }

    function setActiveCellInternal(newCell, opt_editMode) {
      if (activeCellNode !== null) {
        makeActiveCellNormal();
        $(activeCellNode).removeClass("active");
        if (rowsCache[activeRow]) {
          $(rowsCache[activeRow].rowNode).removeClass("active");
        }
      }

      var activeCellChanged = (activeCellNode !== newCell);
      activeCellNode = newCell;

      if (activeCellNode != null) {
        activeRow = getRowFromNode(activeCellNode.parentNode);
        activeCell = activePosX = getCellFromNode(activeCellNode);

        if (opt_editMode == null) {
          opt_editMode = (activeRow == getDataLength()) || options.autoEdit;
        }

        $(activeCellNode).addClass("active");
        $(rowsCache[activeRow].rowNode).addClass("active");

        if (options.editable && opt_editMode && isCellPotentiallyEditable(activeRow, activeCell)) {
          clearTimeout(h_editorLoader);

          if (options.asyncEditorLoading) {
            h_editorLoader = setTimeout(function () {
              makeActiveCellEditable();
            }, options.asyncEditorLoadDelay);
          } else {
            makeActiveCellEditable();
          }
        }
      } else {
        activeRow = activeCell = null;
      }

      if (activeCellChanged) {
        trigger(self.onActiveCellChanged, getActiveCell());
      }
    }

    function clearTextSelection() {
      if (document.selection && document.selection.empty) {
        try {
          //IE fails here if selected element is not in dom
          document.selection.empty();
        } catch (e) { }
      } else if (window.getSelection) {
        var sel = window.getSelection();
        if (sel && sel.removeAllRanges) {
          sel.removeAllRanges();
        }
      }
    }

    function isCellPotentiallyEditable(row, cell) {
      var dataLength = getDataLength();
      // is the data for this row loaded?
      if (row < dataLength && !getDataItem(row)) {
        return false;
      }

      // are we in the Add New row?  can we create new from this cell?
      if (columns[cell].cannotTriggerInsert && row >= dataLength) {
        return false;
      }

      // does this cell have an editor?
      if (!getEditor(row, cell)) {
        return false;
      }

      return true;
    }

    function makeActiveCellNormal() {
      if (!currentEditor) {
        return;
      }
      trigger(self.onBeforeCellEditorDestroy, {editor: currentEditor});
      currentEditor.destroy();
      currentEditor = null;

      if (activeCellNode) {
        var d = getDataItem(activeRow);
        $(activeCellNode).removeClass("editable invalid");
        if (d) {
          var column = columns[activeCell];
          var formatter = getFormatter(activeRow, column);
          activeCellNode.innerHTML = formatter(activeRow, activeCell, getDataItemValueForColumn(d, column), column, d);
          invalidatePostProcessingResults(activeRow);
        }
      }

      // if there previously was text selected on a page (such as selected text in the edit cell just removed),
      // IE can't set focus to anything else correctly
      if (navigator.userAgent.toLowerCase().match(/msie/)) {
        clearTextSelection();
      }

      getEditorLock().deactivate(editController);
    }

    function makeActiveCellEditable(editor) {
      if (!activeCellNode) {
        return;
      }
      if (!options.editable) {
        throw "Grid : makeActiveCellEditable : should never get called when options.editable is false";
      }

      // cancel pending async call if there is one
      clearTimeout(h_editorLoader);

      if (!isCellPotentiallyEditable(activeRow, activeCell)) {
        return;
      }

      var columnDef = columns[activeCell];
      var item = getDataItem(activeRow);

      if (trigger(self.onBeforeEditCell, {row: activeRow, cell: activeCell, item: item, column: columnDef}) === false) {
        setFocus();
        return;
      }

      getEditorLock().activate(editController);
      $(activeCellNode).addClass("editable");

      // don't clear the cell if a custom editor is passed through
      if (!editor) {
        activeCellNode.innerHTML = "";
      }

      currentEditor = new (editor || getEditor(activeRow, activeCell))({
        grid: self,
        gridPosition: absBox($container[0]),
        position: absBox(activeCellNode),
        container: activeCellNode,
        column: columnDef,
        item: item || {},
        commitChanges: commitEditAndSetFocus,
        cancelChanges: cancelEditAndSetFocus
      });

      if (item) {
        currentEditor.loadValue(item);
      }

      serializedEditorValue = currentEditor.serializeValue();

      if (currentEditor.position) {
        handleActiveCellPositionChange();
      }
    }

    function commitEditAndSetFocus() {
      // if the commit fails, it would do so due to a validation error
      // if so, do not steal the focus from the editor
      if (getEditorLock().commitCurrentEdit()) {
        setFocus();
        if (options.autoEdit) {
          navigateDown();
        }
      }
    }

    function cancelEditAndSetFocus() {
      if (getEditorLock().cancelCurrentEdit()) {
        setFocus();
      }
    }

    function absBox(elem) {
      var box = {
        top: elem.offsetTop,
        left: elem.offsetLeft,
        bottom: 0,
        right: 0,
        width: $(elem).outerWidth(),
        height: $(elem).outerHeight(),
        visible: true};
      box.bottom = box.top + box.height;
      box.right = box.left + box.width;

      // walk up the tree
      var offsetParent = elem.offsetParent;
      while ((elem = elem.parentNode) != document.body) {
        if (box.visible && elem.scrollHeight != elem.offsetHeight && $(elem).css("overflowY") != "visible") {
          box.visible = box.bottom > elem.scrollTop && box.top < elem.scrollTop + elem.clientHeight;
        }

        if (box.visible && elem.scrollWidth != elem.offsetWidth && $(elem).css("overflowX") != "visible") {
          box.visible = box.right > elem.scrollLeft && box.left < elem.scrollLeft + elem.clientWidth;
        }

        box.left -= elem.scrollLeft;
        box.top -= elem.scrollTop;

        if (elem === offsetParent) {
          box.left += elem.offsetLeft;
          box.top += elem.offsetTop;
          offsetParent = elem.offsetParent;
        }

        box.bottom = box.top + box.height;
        box.right = box.left + box.width;
      }

      return box;
    }

    function getActiveCellPosition() {
      return absBox(activeCellNode);
    }

    function getGridPosition() {
      return absBox($container[0])
    }

    function handleActiveCellPositionChange() {
      if (!activeCellNode) {
        return;
      }

      trigger(self.onActiveCellPositionChanged, {});

      if (currentEditor) {
        var cellBox = getActiveCellPosition();
        if (currentEditor.show && currentEditor.hide) {
          if (!cellBox.visible) {
            currentEditor.hide();
          } else {
            currentEditor.show();
          }
        }

        if (currentEditor.position) {
          currentEditor.position(cellBox);
        }
      }
    }

    function getCellEditor() {
      return currentEditor;
    }

    function getActiveCell() {
      if (!activeCellNode) {
        return null;
      } else {
        return {row: activeRow, cell: activeCell};
      }
    }

    function getActiveCellNode() {
      return activeCellNode;
    }

    function scrollRowIntoView(row, doPaging) {
      var rowAtTop = row * options.rowHeight;
      var rowAtBottom = (row + 1) * options.rowHeight - viewportH + (viewportHasHScroll ? scrollbarDimensions.height : 0);

      // need to page down?
      if ((row + 1) * options.rowHeight > scrollTop + viewportH + offset) {
        scrollTo(doPaging ? rowAtTop : rowAtBottom);
        render();
      }
      // or page up?
      else if (row * options.rowHeight < scrollTop + offset) {
        scrollTo(doPaging ? rowAtBottom : rowAtTop);
        render();
      }
    }

    function scrollRowToTop(row) {
      scrollTo(row * options.rowHeight);
      render();
    }

    function scrollPage(dir) {
      var deltaRows = dir * numVisibleRows;
      scrollTo((getRowFromPosition(scrollTop) + deltaRows) * options.rowHeight);
      render();

      if (options.enableCellNavigation && activeRow != null) {
        var row = activeRow + deltaRows;
        var dataLengthIncludingAddNew = getDataLengthIncludingAddNew();
        if (row >= dataLengthIncludingAddNew) {
          row = dataLengthIncludingAddNew - 1;
        }
        if (row < 0) {
          row = 0;
        }

        var cell = 0, prevCell = null;
        var prevActivePosX = activePosX;
        while (cell <= activePosX) {
          if (canCellBeActive(row, cell)) {
            prevCell = cell;  
          }
          cell += getColspan(row, cell);
        }

        if (prevCell !== null) {
          setActiveCellInternal(getCellNode(row, prevCell));
          activePosX = prevActivePosX;
        } else {
          resetActiveCell();
        }
      }
    }

    function navigatePageDown() {
      scrollPage(1);
    }

    function navigatePageUp() {
      scrollPage(-1);
    }

    function getColspan(row, cell) {
      var metadata = data.getItemMetadata && data.getItemMetadata(row);
      if (!metadata || !metadata.columns) {
        return 1;
      }

      var columnData = metadata.columns[columns[cell].id] || metadata.columns[cell];
      var colspan = (columnData && columnData.colspan);
      if (colspan === "*") {
        colspan = columns.length - cell;
      } else {
        colspan = colspan || 1;
      }

      return colspan;
    }

    function findFirstFocusableCell(row) {
      var cell = 0;
      while (cell < columns.length) {
        if (canCellBeActive(row, cell)) {
          return cell;
        }
        cell += getColspan(row, cell);
      }
      return null;
    }

    function findLastFocusableCell(row) {
      var cell = 0;
      var lastFocusableCell = null;
      while (cell < columns.length) {
        if (canCellBeActive(row, cell)) {
          lastFocusableCell = cell;
        }
        cell += getColspan(row, cell);
      }
      return lastFocusableCell;
    }

    function gotoRight(row, cell, posX) {
      if (cell >= columns.length) {
        return null;
      }

      do {
        cell += getColspan(row, cell);
      }
      while (cell < columns.length && !canCellBeActive(row, cell));

      if (cell < columns.length) {
        return {
          "row": row,
          "cell": cell,
          "posX": cell
        };
      }
      return null;
    }

    function gotoLeft(row, cell, posX) {
      if (cell <= 0) {
        return null;
      }

      var firstFocusableCell = findFirstFocusableCell(row);
      if (firstFocusableCell === null || firstFocusableCell >= cell) {
        return null;
      }

      var prev = {
        "row": row,
        "cell": firstFocusableCell,
        "posX": firstFocusableCell
      };
      var pos;
      while (true) {
        pos = gotoRight(prev.row, prev.cell, prev.posX);
        if (!pos) {
          return null;
        }
        if (pos.cell >= cell) {
          return prev;
        }
        prev = pos;
      }
    }

    function gotoDown(row, cell, posX) {
      var prevCell;
      var dataLengthIncludingAddNew = getDataLengthIncludingAddNew();
      while (true) {
        if (++row >= dataLengthIncludingAddNew) {
          return null;
        }

        prevCell = cell = 0;
        while (cell <= posX) {
          prevCell = cell;
          cell += getColspan(row, cell);
        }

        if (canCellBeActive(row, prevCell)) {
          return {
            "row": row,
            "cell": prevCell,
            "posX": posX
          };
        }
      }
    }

    function gotoUp(row, cell, posX) {
      var prevCell;
      while (true) {
        if (--row < 0) {
          return null;
        }

        prevCell = cell = 0;
        while (cell <= posX) {
          prevCell = cell;
          cell += getColspan(row, cell);
        }

        if (canCellBeActive(row, prevCell)) {
          return {
            "row": row,
            "cell": prevCell,
            "posX": posX
          };
        }
      }
    }

    function gotoNext(row, cell, posX) {
      if (row == null && cell == null) {
        row = cell = posX = 0;
        if (canCellBeActive(row, cell)) {
          return {
            "row": row,
            "cell": cell,
            "posX": cell
          };
        }
      }

      var pos = gotoRight(row, cell, posX);
      if (pos) {
        return pos;
      }

      var firstFocusableCell = null;
      var dataLengthIncludingAddNew = getDataLengthIncludingAddNew();
      while (++row < dataLengthIncludingAddNew) {
        firstFocusableCell = findFirstFocusableCell(row);
        if (firstFocusableCell !== null) {
          return {
            "row": row,
            "cell": firstFocusableCell,
            "posX": firstFocusableCell
          };
        }
      }
      return null;
    }

    function gotoPrev(row, cell, posX) {
      if (row == null && cell == null) {
        row = getDataLengthIncludingAddNew() - 1;
        cell = posX = columns.length - 1;
        if (canCellBeActive(row, cell)) {
          return {
            "row": row,
            "cell": cell,
            "posX": cell
          };
        }
      }

      var pos;
      var lastSelectableCell;
      while (!pos) {
        pos = gotoLeft(row, cell, posX);
        if (pos) {
          break;
        }
        if (--row < 0) {
          return null;
        }

        cell = 0;
        lastSelectableCell = findLastFocusableCell(row);
        if (lastSelectableCell !== null) {
          pos = {
            "row": row,
            "cell": lastSelectableCell,
            "posX": lastSelectableCell
          };
        }
      }
      return pos;
    }

    function navigateRight() {
      return navigate("right");
    }

    function navigateLeft() {
      return navigate("left");
    }

    function navigateDown() {
      return navigate("down");
    }

    function navigateUp() {
      return navigate("up");
    }

    function navigateNext() {
      return navigate("next");
    }

    function navigatePrev() {
      return navigate("prev");
    }

    /**
     * @param {string} dir Navigation direction.
     * @return {boolean} Whether navigation resulted in a change of active cell.
     */
    function navigate(dir) {
      if (!options.enableCellNavigation) {
        return false;
      }

      if (!activeCellNode && dir != "prev" && dir != "next") {
        return false;
      }

      if (!getEditorLock().commitCurrentEdit()) {
        return true;
      }
      setFocus();

      var tabbingDirections = {
        "up": -1,
        "down": 1,
        "left": -1,
        "right": 1,
        "prev": -1,
        "next": 1
      };
      tabbingDirection = tabbingDirections[dir];

      var stepFunctions = {
        "up": gotoUp,
        "down": gotoDown,
        "left": gotoLeft,
        "right": gotoRight,
        "prev": gotoPrev,
        "next": gotoNext
      };
      var stepFn = stepFunctions[dir];
      var pos = stepFn(activeRow, activeCell, activePosX);
      if (pos) {
        var isAddNewRow = (pos.row == getDataLength());
        scrollCellIntoView(pos.row, pos.cell, !isAddNewRow);
        setActiveCellInternal(getCellNode(pos.row, pos.cell));
        activePosX = pos.posX;
        return true;
      } else {
        setActiveCellInternal(getCellNode(activeRow, activeCell));
        return false;
      }
    }

    function getCellNode(row, cell) {
      if (rowsCache[row]) {
        ensureCellNodesInRowsCache(row);
        return rowsCache[row].cellNodesByColumnIdx[cell];
      }
      return null;
    }

    function setActiveCell(row, cell) {
      if (!initialized) { return; }
      if (row > getDataLength() || row < 0 || cell >= columns.length || cell < 0) {
        return;
      }

      if (!options.enableCellNavigation) {
        return;
      }

      scrollCellIntoView(row, cell, false);
      setActiveCellInternal(getCellNode(row, cell), false);
    }

    function canCellBeActive(row, cell) {
      if (!options.enableCellNavigation || row >= getDataLengthIncludingAddNew() ||
          row < 0 || cell >= columns.length || cell < 0) {
        return false;
      }

      var rowMetadata = data.getItemMetadata && data.getItemMetadata(row);
      if (rowMetadata && typeof rowMetadata.focusable === "boolean") {
        return rowMetadata.focusable;
      }

      var columnMetadata = rowMetadata && rowMetadata.columns;
      if (columnMetadata && columnMetadata[columns[cell].id] && typeof columnMetadata[columns[cell].id].focusable === "boolean") {
        return columnMetadata[columns[cell].id].focusable;
      }
      if (columnMetadata && columnMetadata[cell] && typeof columnMetadata[cell].focusable === "boolean") {
        return columnMetadata[cell].focusable;
      }

      return columns[cell].focusable;
    }

    function canCellBeSelected(row, cell) {
      if (row >= getDataLength() || row < 0 || cell >= columns.length || cell < 0) {
        return false;
      }

      var rowMetadata = data.getItemMetadata && data.getItemMetadata(row);
      if (rowMetadata && typeof rowMetadata.selectable === "boolean") {
        return rowMetadata.selectable;
      }

      var columnMetadata = rowMetadata && rowMetadata.columns && (rowMetadata.columns[columns[cell].id] || rowMetadata.columns[cell]);
      if (columnMetadata && typeof columnMetadata.selectable === "boolean") {
        return columnMetadata.selectable;
      }

      return columns[cell].selectable;
    }

    function gotoCell(row, cell, forceEdit) {
      if (!initialized) { return; }
      if (!canCellBeActive(row, cell)) {
        return;
      }

      if (!getEditorLock().commitCurrentEdit()) {
        return;
      }

      scrollCellIntoView(row, cell, false);

      var newCell = getCellNode(row, cell);

      // if selecting the 'add new' row, start editing right away
      setActiveCellInternal(newCell, forceEdit || (row === getDataLength()) || options.autoEdit);

      // if no editor was created, set the focus back on the grid
      if (!currentEditor) {
        setFocus();
      }
    }


    //////////////////////////////////////////////////////////////////////////////////////////////
    // IEditor implementation for the editor lock

    function commitCurrentEdit() {
      var item = getDataItem(activeRow);
      var column = columns[activeCell];

      if (currentEditor) {
        if (currentEditor.isValueChanged()) {
          var validationResults = currentEditor.validate();

          if (validationResults.valid) {
            if (activeRow < getDataLength()) {
              var editCommand = {
                row: activeRow,
                cell: activeCell,
                editor: currentEditor,
                serializedValue: currentEditor.serializeValue(),
                prevSerializedValue: serializedEditorValue,
                execute: function () {
                  this.editor.applyValue(item, this.serializedValue);
                  updateRow(this.row);
                  trigger(self.onCellChange, {
                    row: activeRow,
                    cell: activeCell,
                    item: item
                  });
                },
                undo: function () {
                  this.editor.applyValue(item, this.prevSerializedValue);
                  updateRow(this.row);
                  trigger(self.onCellChange, {
                    row: activeRow,
                    cell: activeCell,
                    item: item
                  });
                }
              };

              if (options.editCommandHandler) {
                makeActiveCellNormal();
                options.editCommandHandler(item, column, editCommand);
              } else {
                editCommand.execute();
                makeActiveCellNormal();
              }

            } else {
              var newItem = {};
              currentEditor.applyValue(newItem, currentEditor.serializeValue());
              makeActiveCellNormal();
              trigger(self.onAddNewRow, {item: newItem, column: column});
            }

            // check whether the lock has been re-acquired by event handlers
            return !getEditorLock().isActive();
          } else {
            // Re-add the CSS class to trigger transitions, if any.
            $(activeCellNode).removeClass("invalid");
            $(activeCellNode).width();  // force layout
            $(activeCellNode).addClass("invalid");

            trigger(self.onValidationError, {
              editor: currentEditor,
              cellNode: activeCellNode,
              validationResults: validationResults,
              row: activeRow,
              cell: activeCell,
              column: column
            });

            currentEditor.focus();
            return false;
          }
        }

        makeActiveCellNormal();
      }
      return true;
    }

    function cancelCurrentEdit() {
      makeActiveCellNormal();
      return true;
    }

    function rowsToRanges(rows) {
      var ranges = [];
      var lastCell = columns.length - 1;
      for (var i = 0; i < rows.length; i++) {
        ranges.push(new Slick.Range(rows[i], 0, rows[i], lastCell));
      }
      return ranges;
    }

    function getSelectedRows() {
      if (!selectionModel) {
        throw "Selection model is not set";
      }
      return selectedRows;
    }

    function setSelectedRows(rows) {
      if (!selectionModel) {
        throw "Selection model is not set";
      }
      selectionModel.setSelectedRanges(rowsToRanges(rows));
    }


    //////////////////////////////////////////////////////////////////////////////////////////////
    // Debug

    this.debug = function () {
      var s = "";

      s += ("\n" + "counter_rows_rendered:  " + counter_rows_rendered);
      s += ("\n" + "counter_rows_removed:  " + counter_rows_removed);
      s += ("\n" + "renderedRows:  " + renderedRows);
      s += ("\n" + "numVisibleRows:  " + numVisibleRows);
      s += ("\n" + "maxSupportedCssHeight:  " + maxSupportedCssHeight);
      s += ("\n" + "n(umber of pages):  " + n);
      s += ("\n" + "(current) page:  " + page);
      s += ("\n" + "page height (ph):  " + ph);
      s += ("\n" + "vScrollDir:  " + vScrollDir);

      alert(s);
    };

    // a debug helper to be able to access private members
    this.eval = function (expr) {
      return eval(expr);
    };

    //////////////////////////////////////////////////////////////////////////////////////////////
    // Public API

    $.extend(this, {
      "slickGridVersion": "2.1",

      // Events
      "onScroll": new Slick.Event(),
      "onSort": new Slick.Event(),
      "onHeaderMouseEnter": new Slick.Event(),
      "onHeaderMouseLeave": new Slick.Event(),
      "onHeaderContextMenu": new Slick.Event(),
      "onHeaderClick": new Slick.Event(),
      "onHeaderCellRendered": new Slick.Event(),
      "onBeforeHeaderCellDestroy": new Slick.Event(),
      "onHeaderRowCellRendered": new Slick.Event(),
      "onBeforeHeaderRowCellDestroy": new Slick.Event(),
      "onMouseEnter": new Slick.Event(),
      "onMouseLeave": new Slick.Event(),
      "onClick": new Slick.Event(),
      "onDblClick": new Slick.Event(),
      "onContextMenu": new Slick.Event(),
      "onKeyDown": new Slick.Event(),
      "onAddNewRow": new Slick.Event(),
      "onValidationError": new Slick.Event(),
      "onViewportChanged": new Slick.Event(),
      "onColumnsReordered": new Slick.Event(),
      "onColumnsResized": new Slick.Event(),
      "onCellChange": new Slick.Event(),
      "onBeforeEditCell": new Slick.Event(),
      "onBeforeCellEditorDestroy": new Slick.Event(),
      "onBeforeDestroy": new Slick.Event(),
      "onActiveCellChanged": new Slick.Event(),
      "onActiveCellPositionChanged": new Slick.Event(),
      "onDragInit": new Slick.Event(),
      "onDragStart": new Slick.Event(),
      "onDrag": new Slick.Event(),
      "onDragEnd": new Slick.Event(),
      "onSelectedRowsChanged": new Slick.Event(),
      "onCellCssStylesChanged": new Slick.Event(),

      // Methods
      "registerPlugin": registerPlugin,
      "unregisterPlugin": unregisterPlugin,
      "getColumns": getColumns,
      "setColumns": setColumns,
      "getColumnIndex": getColumnIndex,
      "updateColumnHeader": updateColumnHeader,
      "setSortColumn": setSortColumn,
      "setSortColumns": setSortColumns,
      "getSortColumns": getSortColumns,
      "autosizeColumns": autosizeColumns,
      "getOptions": getOptions,
      "setOptions": setOptions,
      "getData": getData,
      "getDataLength": getDataLength,
      "getDataItem": getDataItem,
      "setData": setData,
      "getSelectionModel": getSelectionModel,
      "setSelectionModel": setSelectionModel,
      "getSelectedRows": getSelectedRows,
      "setSelectedRows": setSelectedRows,
      "getContainerNode": getContainerNode,

      "render": render,
      "invalidate": invalidate,
      "invalidateRow": invalidateRow,
      "invalidateRows": invalidateRows,
      "invalidateAllRows": invalidateAllRows,
      "updateCell": updateCell,
      "updateRow": updateRow,
      "getViewport": getVisibleRange,
      "getRenderedRange": getRenderedRange,
      "resizeCanvas": resizeCanvas,
      "updateRowCount": updateRowCount,
      "scrollRowIntoView": scrollRowIntoView,
      "scrollRowToTop": scrollRowToTop,
      "scrollCellIntoView": scrollCellIntoView,
      "getCanvasNode": getCanvasNode,
      "focus": setFocus,

      "getCellFromPoint": getCellFromPoint,
      "getCellFromEvent": getCellFromEvent,
      "getActiveCell": getActiveCell,
      "setActiveCell": setActiveCell,
      "getActiveCellNode": getActiveCellNode,
      "getActiveCellPosition": getActiveCellPosition,
      "resetActiveCell": resetActiveCell,
      "editActiveCell": makeActiveCellEditable,
      "getCellEditor": getCellEditor,
      "getCellNode": getCellNode,
      "getCellNodeBox": getCellNodeBox,
      "canCellBeSelected": canCellBeSelected,
      "canCellBeActive": canCellBeActive,
      "navigatePrev": navigatePrev,
      "navigateNext": navigateNext,
      "navigateUp": navigateUp,
      "navigateDown": navigateDown,
      "navigateLeft": navigateLeft,
      "navigateRight": navigateRight,
      "navigatePageUp": navigatePageUp,
      "navigatePageDown": navigatePageDown,
      "gotoCell": gotoCell,
      "getTopPanel": getTopPanel,
      "setTopPanelVisibility": setTopPanelVisibility,
      "setHeaderRowVisibility": setHeaderRowVisibility,
      "getHeaderRow": getHeaderRow,
      "getHeaderRowColumn": getHeaderRowColumn,
      "getGridPosition": getGridPosition,
      "flashCell": flashCell,
      "addCellCssStyles": addCellCssStyles,
      "setCellCssStyles": setCellCssStyles,
      "removeCellCssStyles": removeCellCssStyles,
      "getCellCssStyles": getCellCssStyles,

      "init": finishInitialization,
      "destroy": destroy,

      // IEditor implementation
      "getEditorLock": getEditorLock,
      "getEditController": getEditController
    });

    init();
  }
}(jQuery));


  }).apply(root, arguments);
});
}(this));

(function(root) {
define("slick.dataview", ["jquery"], function() {
  return (function() {
(function ($) {
  $.extend(true, window, {
    Slick: {
      Data: {
        DataView: DataView,
        Aggregators: {
          Avg: AvgAggregator,
          Min: MinAggregator,
          Max: MaxAggregator,
          Sum: SumAggregator
        }
      }
    }
  });


  /***
   * A sample Model implementation.
   * Provides a filtered view of the underlying data.
   *
   * Relies on the data item having an "id" property uniquely identifying it.
   */
  function DataView(options) {
    var self = this;

    var defaults = {
      groupItemMetadataProvider: null,
      inlineFilters: false
    };


    // private
    var idProperty = "cgrid";  // property holding a unique row id
    var items = [];         // data by index
    var rows = [];          // data by row
    var idxById = {};       // indexes by id
    var rowsById = null;    // rows by id; lazy-calculated
    var filter = null;      // filter function
    var updated = null;     // updated item ids
    var suspend = false;    // suspends the recalculation
    var sortAsc = true;
    var fastSortField;
    var sortComparer;
    var refreshHints = {};
    var prevRefreshHints = {};
    var filterArgs;
    var filteredItems = [];
    var compiledFilter;
    var compiledFilterWithCaching;
    var filterCache = [];

    // grouping
    var groupingInfoDefaults = {
      getter: null,
      formatter: null,
      comparer: function(a, b) { return a.value - b.value; },
      predefinedValues: [],
      aggregators: [],
      aggregateEmpty: false,
      aggregateCollapsed: false,
      aggregateChildGroups: false,
      collapsed: false,
      displayTotalsRow: true,
      lazyTotalsCalculation: false
    };
    var groupingInfos = [];
    var groups = [];
    var toggledGroupsByLevel = [];
    var groupingDelimiter = ':|:';

    var pagesize = 0;
    var pagenum = 0;
    var totalRows = 0;

    // events
    var onRowCountChanged = new Slick.Event();
    var onRowsChanged = new Slick.Event();
    var onPagingInfoChanged = new Slick.Event();
    var onDataUpdate = new Slick.Event();

    options = $.extend(true, {}, defaults, options);


    function beginUpdate() {
      suspend = true;
    }

    function endUpdate() {
      suspend = false;
      refresh();
    }

    function setRefreshHints(hints) {
      refreshHints = hints;
    }

    function setFilterArgs(args) {
      filterArgs = args;
    }

    function updateIdxById(startingIndex) {
      startingIndex = startingIndex || 0;
      var id;
      for (var i = startingIndex, l = items.length; i < l; i++) {
        id = items[i][idProperty];
        if (id === undefined) {
          throw "Each data element must implement a unique 'id' property";
        }
        idxById[id] = i;
      }
    }

    function ensureIdUniqueness() {
      var id;
      for (var i = 0, l = items.length; i < l; i++) {
        id = items[i][idProperty];
        if (id === undefined || idxById[id] !== i) {
          throw "Each data element must implement a unique 'id' property";
        }
      }
    }

    function getItems() {
      return items;
    }

    function getFilteredItems() {
      return filteredItems;
    }

    function setItems(data, objectIdProperty) {
      if (objectIdProperty !== undefined) {
        idProperty = objectIdProperty;
      }
      items = filteredItems = data;
      idxById = {};
      updateIdxById();
      ensureIdUniqueness();
      refresh();
    }

    function setPagingOptions(args) {
      if (args.pageSize != undefined) {
        pagesize = args.pageSize;
        pagenum = pagesize ? Math.min(pagenum, Math.max(0, Math.ceil(totalRows / pagesize) - 1)) : 0;
      }

      if (args.pageNum != undefined) {
        pagenum = Math.min(args.pageNum, Math.max(0, Math.ceil(totalRows / pagesize) - 1));
      }

      onPagingInfoChanged.notify(getPagingInfo(), null, self);

      refresh();
    }

    function getPagingInfo() {
      var totalPages = pagesize ? Math.max(1, Math.ceil(totalRows / pagesize)) : 1;
      return {pageSize: pagesize, pageNum: pagenum, totalRows: totalRows, totalPages: totalPages};
    }

    function sort(comparer, ascending) {
      sortAsc = ascending;
      sortComparer = comparer;
      fastSortField = null;
      if (ascending === false) {
        items.reverse();
      }
      items.sort(comparer);
      if (ascending === false) {
        items.reverse();
      }
      idxById = {};
      updateIdxById();
      refresh();
    }

    /***
     * Provides a workaround for the extremely slow sorting in IE.
     * Does a [lexicographic] sort on a give column by temporarily overriding Object.prototype.toString
     * to return the value of that field and then doing a native Array.sort().
     */
    function fastSort(field, ascending) {
      sortAsc = ascending;
      fastSortField = field;
      sortComparer = null;
      var oldToString = Object.prototype.toString;
      Object.prototype.toString = (typeof field == "function") ? field : function () {
        return this[field]
      };
      // an extra reversal for descending sort keeps the sort stable
      // (assuming a stable native sort implementation, which isn't true in some cases)
      if (ascending === false) {
        items.reverse();
      }
      items.sort();
      Object.prototype.toString = oldToString;
      if (ascending === false) {
        items.reverse();
      }
      idxById = {};
      updateIdxById();
      refresh();
    }

    function reSort() {
      if (sortComparer) {
        sort(sortComparer, sortAsc);
      } else if (fastSortField) {
        fastSort(fastSortField, sortAsc);
      }
    }

    function setFilter(filterFn) {
      filter = filterFn;
      if (options.inlineFilters) {
        compiledFilter = compileFilter();
        compiledFilterWithCaching = compileFilterWithCaching();
      }
      refresh();
    }

    function getGrouping() {
      return groupingInfos;
    }

    function setGrouping(groupingInfo) {
      if (!options.groupItemMetadataProvider) {
        options.groupItemMetadataProvider = new Slick.Data.GroupItemMetadataProvider();
      }

      groups = [];
      toggledGroupsByLevel = [];
      groupingInfo = groupingInfo || [];
      groupingInfos = (groupingInfo instanceof Array) ? groupingInfo : [groupingInfo];

      for (var i = 0; i < groupingInfos.length; i++) {
        var gi = groupingInfos[i] = $.extend(true, {}, groupingInfoDefaults, groupingInfos[i]);
        gi.getterIsAFn = typeof gi.getter === "function";

        // pre-compile accumulator loops
        gi.compiledAccumulators = [];
        var idx = gi.aggregators.length;
        while (idx--) {
          gi.compiledAccumulators[idx] = compileAccumulatorLoop(gi.aggregators[idx]);
        }

        toggledGroupsByLevel[i] = {};
      }

      refresh();
    }

    /**
     * @deprecated Please use {@link setGrouping}.
     */
    function groupBy(valueGetter, valueFormatter, sortComparer) {
      if (valueGetter == null) {
        setGrouping([]);
        return;
      }

      setGrouping({
        getter: valueGetter,
        formatter: valueFormatter,
        comparer: sortComparer
      });
    }

    /**
     * @deprecated Please use {@link setGrouping}.
     */
    function setAggregators(groupAggregators, includeCollapsed) {
      if (!groupingInfos.length) {
        throw new Error("At least one grouping must be specified before calling setAggregators().");
      }

      groupingInfos[0].aggregators = groupAggregators;
      groupingInfos[0].aggregateCollapsed = includeCollapsed;

      setGrouping(groupingInfos);
    }

    function getItemByIdx(i) {
      return items[i];
    }

    function getIdxById(id) {
      return idxById[id];
    }

    function ensureRowsByIdCache() {
      if (!rowsById) {
        rowsById = {};
        for (var i = 0, l = rows.length; i < l; i++) {
          rowsById[rows[i][idProperty]] = i;
        }
      }
    }

    function getRowById(id) {
      ensureRowsByIdCache();
      return rowsById[id];
    }

    function getItemById(id) {
      return items[idxById[id]];
    }

    function mapIdsToRows(idArray) {
      var rows = [];
      ensureRowsByIdCache();
      for (var i = 0, l = idArray.length; i < l; i++) {
        var row = rowsById[idArray[i]];
        if (row != null) {
          rows[rows.length] = row;
        }
      }
      return rows;
    }

    function mapRowsToIds(rowArray) {
      var ids = [];
      for (var i = 0, l = rowArray.length; i < l; i++) {
        if (rowArray[i] < rows.length) {
          ids[ids.length] = rows[rowArray[i]][idProperty];
        }
      }
      return ids;
    }

    function updateItem(id, item) {
      if (idxById[id] === undefined || id !== item[idProperty]) {
        throw "Invalid or non-matching id";
      }
      items[idxById[id]] = item;
      if (!updated) {
        updated = {};
      }
      updated[id] = true;
      refresh();
    }

    function insertItem(insertBefore, item) {
      items.splice(insertBefore, 0, item);
      updateIdxById(insertBefore);
      refresh();
    }

    function addItem(item) {
      items.push(item);
      updateIdxById(items.length - 1);
      refresh();
    }

    function deleteItem(id) {
      var idx = idxById[id];
      if (idx === undefined) {
        throw "Invalid id";
      }
      delete idxById[id];
      items.splice(idx, 1);
      updateIdxById(idx);
      refresh();
    }

    function getLength() {
      return rows.length;
    }

    function getItem(i) {
      var item = rows[i];

      // if this is a group row, make sure totals are calculated and update the title
      if (item && item.__group && item.totals && !item.totals.initialized) {
        var gi = groupingInfos[item.level];
        if (!gi.displayTotalsRow) {
          calculateTotals(item.totals);
          item.title = gi.formatter ? gi.formatter(item) : item.value;
        }
      }
      // if this is a totals row, make sure it's calculated
      else if (item && item.__groupTotals && !item.initialized) {
        calculateTotals(item);
      }

      return item;
    }

    function getItemMetadata(i) {
      var item = rows[i];
      if (item === undefined) {
        return null;
      }

      // overrides for grouping rows
      if (item.__group) {
        return options.groupItemMetadataProvider.getGroupRowMetadata(item);
      }

      // overrides for totals rows
      if (item.__groupTotals) {
        return options.groupItemMetadataProvider.getTotalsRowMetadata(item);
      }

      return null;
    }

    function expandCollapseAllGroups(level, collapse) {
      if (level == null) {
        for (var i = 0; i < groupingInfos.length; i++) {
          toggledGroupsByLevel[i] = {};
          groupingInfos[i].collapsed = collapse;
        }
      } else {
        toggledGroupsByLevel[level] = {};
        groupingInfos[level].collapsed = collapse;
      }
      refresh();
    }

    /**
     * @param level {Number} Optional level to collapse.  If not specified, applies to all levels.
     */
    function collapseAllGroups(level) {
      expandCollapseAllGroups(level, true);
    }

    /**
     * @param level {Number} Optional level to expand.  If not specified, applies to all levels.
     */
    function expandAllGroups(level) {
      expandCollapseAllGroups(level, false);
    }

    function expandCollapseGroup(level, groupingKey, collapse) {
      toggledGroupsByLevel[level][groupingKey] = groupingInfos[level].collapsed ^ collapse;
      refresh();
    }

    /**
     * @param varArgs Either a Slick.Group's "groupingKey" property, or a
     *     variable argument list of grouping values denoting a unique path to the row.  For
     *     example, calling collapseGroup('high', '10%') will collapse the '10%' subgroup of
     *     the 'high' group.
     */
    function collapseGroup(varArgs) {
      var args = Array.prototype.slice.call(arguments);
      var arg0 = args[0];
      if (args.length == 1 && arg0.indexOf(groupingDelimiter) != -1) {
        expandCollapseGroup(arg0.split(groupingDelimiter).length - 1, arg0, true);
      } else {
        expandCollapseGroup(args.length - 1, args.join(groupingDelimiter), true);
      }
    }

    /**
     * @param varArgs Either a Slick.Group's "groupingKey" property, or a
     *     variable argument list of grouping values denoting a unique path to the row.  For
     *     example, calling expandGroup('high', '10%') will expand the '10%' subgroup of
     *     the 'high' group.
     */
    function expandGroup(varArgs) {
      var args = Array.prototype.slice.call(arguments);
      var arg0 = args[0];
      if (args.length == 1 && arg0.indexOf(groupingDelimiter) != -1) {
        expandCollapseGroup(arg0.split(groupingDelimiter).length - 1, arg0, false);
      } else {
        expandCollapseGroup(args.length - 1, args.join(groupingDelimiter), false);
      }
    }

    function getGroups() {
      return groups;
    }

    function extractGroups(rows, parentGroup) {
      var group;
      var val;
      var groups = [];
      var groupsByVal = {};
      var r;
      var level = parentGroup ? parentGroup.level + 1 : 0;
      var gi = groupingInfos[level];

      for (var i = 0, l = gi.predefinedValues.length; i < l; i++) {
        val = gi.predefinedValues[i];
        group = groupsByVal[val];
        if (!group) {
          group = new Slick.Group();
          group.value = val;
          group.level = level;
          group.groupingKey = (parentGroup ? parentGroup.groupingKey + groupingDelimiter : '') + val;
          groups[groups.length] = group;
          groupsByVal[val] = group;
        }
      }

      for (var i = 0, l = rows.length; i < l; i++) {
        r = rows[i];
        val = gi.getterIsAFn ? gi.getter(r) : r[gi.getter];
        group = groupsByVal[val];
        if (!group) {
          group = new Slick.Group();
          group.value = val;
          group.level = level;
          group.groupingKey = (parentGroup ? parentGroup.groupingKey + groupingDelimiter : '') + val;
          groups[groups.length] = group;
          groupsByVal[val] = group;
        }

        group.rows[group.count++] = r;
      }

      if (level < groupingInfos.length - 1) {
        for (var i = 0; i < groups.length; i++) {
          group = groups[i];
          group.groups = extractGroups(group.rows, group);
        }
      }      

      groups.sort(groupingInfos[level].comparer);

      return groups;
    }

    function calculateTotals(totals) {
      var group = totals.group;
      var gi = groupingInfos[group.level];
      var isLeafLevel = (group.level == groupingInfos.length);
      var agg, idx = gi.aggregators.length;

      if (!isLeafLevel && gi.aggregateChildGroups) {
        // make sure all the subgroups are calculated
        var i = group.groups.length;
        while (i--) {
          if (!group.groups[i].initialized) {
            calculateTotals(group.groups[i]);
          }
        }
      }

      while (idx--) {
        agg = gi.aggregators[idx];
        agg.init();
        if (!isLeafLevel && gi.aggregateChildGroups) {
          gi.compiledAccumulators[idx].call(agg, group.groups);
        } else {
          gi.compiledAccumulators[idx].call(agg, group.rows);
        }
        agg.storeResult(totals);
      }
      totals.initialized = true;
    }

    function addGroupTotals(group) {
      var gi = groupingInfos[group.level];
      var totals = new Slick.GroupTotals();
      totals.group = group;
      group.totals = totals;
      if (!gi.lazyTotalsCalculation) {
        calculateTotals(totals);
      }
    }

    function addTotals(groups, level) {
      level = level || 0;
      var gi = groupingInfos[level];
      var groupCollapsed = gi.collapsed;
      var toggledGroups = toggledGroupsByLevel[level];      
      var idx = groups.length, g;
      while (idx--) {
        g = groups[idx];

        if (g.collapsed && !gi.aggregateCollapsed) {
          continue;
        }

        // Do a depth-first aggregation so that parent group aggregators can access subgroup totals.
        if (g.groups) {
          addTotals(g.groups, level + 1);
        }

        if (gi.aggregators.length && (
            gi.aggregateEmpty || g.rows.length || (g.groups && g.groups.length))) {
          addGroupTotals(g);
        }

        g.collapsed = groupCollapsed ^ toggledGroups[g.groupingKey];
        g.title = gi.formatter ? gi.formatter(g) : g.value;
      }
    } 

    function flattenGroupedRows(groups, level) {
      level = level || 0;
      var gi = groupingInfos[level];
      var groupedRows = [], rows, gl = 0, g;
      for (var i = 0, l = groups.length; i < l; i++) {
        g = groups[i];
        groupedRows[gl++] = g;

        if (!g.collapsed) {
          rows = g.groups ? flattenGroupedRows(g.groups, level + 1) : g.rows;
          for (var j = 0, jj = rows.length; j < jj; j++) {
            groupedRows[gl++] = rows[j];
          }
        }

        if (g.totals && gi.displayTotalsRow && (!g.collapsed || gi.aggregateCollapsed)) {
          groupedRows[gl++] = g.totals;
        }
      }
      return groupedRows;
    }

    function getFunctionInfo(fn) {
      var fnRegex = /^function[^(]*\(([^)]*)\)\s*{([\s\S]*)}$/;
      var matches = fn.toString().match(fnRegex);
      return {
        params: matches[1].split(","),
        body: matches[2]
      };
    }

    function compileAccumulatorLoop(aggregator) {
      var accumulatorInfo = getFunctionInfo(aggregator.accumulate);
      var fn = new Function(
          "_items",
          "for (var " + accumulatorInfo.params[0] + ", _i=0, _il=_items.length; _i<_il; _i++) {" +
              accumulatorInfo.params[0] + " = _items[_i]; " +
              accumulatorInfo.body +
          "}"
      );
      fn.displayName = fn.name = "compiledAccumulatorLoop";
      return fn;
    }

    function compileFilter() {
      var filterInfo = getFunctionInfo(filter);

      var filterBody = filterInfo.body
          .replace(/return false\s*([;}]|$)/gi, "{ continue _coreloop; }$1")
          .replace(/return true\s*([;}]|$)/gi, "{ _retval[_idx++] = $item$; continue _coreloop; }$1")
          .replace(/return ([^;}]+?)\s*([;}]|$)/gi,
          "{ if ($1) { _retval[_idx++] = $item$; }; continue _coreloop; }$2");

      // This preserves the function template code after JS compression,
      // so that replace() commands still work as expected.
      var tpl = [
        //"function(_items, _args) { ",
        "var _retval = [], _idx = 0; ",
        "var $item$, $args$ = _args; ",
        "_coreloop: ",
        "for (var _i = 0, _il = _items.length; _i < _il; _i++) { ",
        "$item$ = _items[_i]; ",
        "$filter$; ",
        "} ",
        "return _retval; "
        //"}"
      ].join("");
      tpl = tpl.replace(/\$filter\$/gi, filterBody);
      tpl = tpl.replace(/\$item\$/gi, filterInfo.params[0]);
      tpl = tpl.replace(/\$args\$/gi, filterInfo.params[1]);

      var fn = new Function("_items,_args", tpl);
      fn.displayName = fn.name = "compiledFilter";
      return fn;
    }

    function compileFilterWithCaching() {
      var filterInfo = getFunctionInfo(filter);

      var filterBody = filterInfo.body
          .replace(/return false\s*([;}]|$)/gi, "{ continue _coreloop; }$1")
          .replace(/return true\s*([;}]|$)/gi, "{ _cache[_i] = true;_retval[_idx++] = $item$; continue _coreloop; }$1")
          .replace(/return ([^;}]+?)\s*([;}]|$)/gi,
          "{ if ((_cache[_i] = $1)) { _retval[_idx++] = $item$; }; continue _coreloop; }$2");

      // This preserves the function template code after JS compression,
      // so that replace() commands still work as expected.
      var tpl = [
        //"function(_items, _args, _cache) { ",
        "var _retval = [], _idx = 0; ",
        "var $item$, $args$ = _args; ",
        "_coreloop: ",
        "for (var _i = 0, _il = _items.length; _i < _il; _i++) { ",
        "$item$ = _items[_i]; ",
        "if (_cache[_i]) { ",
        "_retval[_idx++] = $item$; ",
        "continue _coreloop; ",
        "} ",
        "$filter$; ",
        "} ",
        "return _retval; "
        //"}"
      ].join("");
      tpl = tpl.replace(/\$filter\$/gi, filterBody);
      tpl = tpl.replace(/\$item\$/gi, filterInfo.params[0]);
      tpl = tpl.replace(/\$args\$/gi, filterInfo.params[1]);

      var fn = new Function("_items,_args,_cache", tpl);
      fn.displayName = fn.name = "compiledFilterWithCaching";
      return fn;
    }

    function uncompiledFilter(items, args) {
      var retval = [], idx = 0;

      for (var i = 0, ii = items.length; i < ii; i++) {
        if (filter(items[i], args)) {
          retval[idx++] = items[i];
        }
      }

      return retval;
    }

    function uncompiledFilterWithCaching(items, args, cache) {
      var retval = [], idx = 0, item;

      for (var i = 0, ii = items.length; i < ii; i++) {
        item = items[i];
        if (cache[i]) {
          retval[idx++] = item;
        } else if (filter(item, args)) {
          retval[idx++] = item;
          cache[i] = true;
        }
      }

      return retval;
    }

    function getFilteredAndPagedItems(items) {
      if (filter) {
        var batchFilter = options.inlineFilters ? compiledFilter : uncompiledFilter;
        var batchFilterWithCaching = options.inlineFilters ? compiledFilterWithCaching : uncompiledFilterWithCaching;

        if (refreshHints.isFilterNarrowing) {
          filteredItems = batchFilter(filteredItems, filterArgs);
        } else if (refreshHints.isFilterExpanding) {
          filteredItems = batchFilterWithCaching(items, filterArgs, filterCache);
        } else if (!refreshHints.isFilterUnchanged) {
          filteredItems = batchFilter(items, filterArgs);
        }
      } else {
        // special case:  if not filtering and not paging, the resulting
        // rows collection needs to be a copy so that changes due to sort
        // can be caught
        filteredItems = pagesize ? items : items.concat();
      }

      // get the current page
      var paged;
      if (pagesize) {
        if (filteredItems.length < pagenum * pagesize) {
          pagenum = Math.floor(filteredItems.length / pagesize);
        }
        paged = filteredItems.slice(pagesize * pagenum, pagesize * pagenum + pagesize);
      } else {
        paged = filteredItems;
      }

      return {totalRows: filteredItems.length, rows: paged};
    }

    function getRowDiffs(rows, newRows) {
      var item, r, eitherIsNonData, diff = [];
      var from = 0, to = newRows.length;

      if (refreshHints && refreshHints.ignoreDiffsBefore) {
        from = Math.max(0,
            Math.min(newRows.length, refreshHints.ignoreDiffsBefore));
      }

      if (refreshHints && refreshHints.ignoreDiffsAfter) {
        to = Math.min(newRows.length,
            Math.max(0, refreshHints.ignoreDiffsAfter));
      }

      for (var i = from, rl = rows.length; i < to; i++) {
        if (i >= rl) {
          diff[diff.length] = i;
        } else {
          item = newRows[i];
          r = rows[i];

          if ((groupingInfos.length && (eitherIsNonData = (item.__nonDataRow) || (r.__nonDataRow)) &&
              item.__group !== r.__group ||
              item.__group && !item.equals(r))
              || (eitherIsNonData &&
              // no good way to compare totals since they are arbitrary DTOs
              // deep object comparison is pretty expensive
              // always considering them 'dirty' seems easier for the time being
              (item.__groupTotals || r.__groupTotals))
              || item[idProperty] != r[idProperty]
              || (updated && updated[item[idProperty]])
              ) {
            diff[diff.length] = i;
          }
        }
      }
      return diff;
    }

    function recalc(_items) {
      rowsById = null;

      if (refreshHints.isFilterNarrowing != prevRefreshHints.isFilterNarrowing ||
          refreshHints.isFilterExpanding != prevRefreshHints.isFilterExpanding) {
        filterCache = [];
      }

      var filteredItems = getFilteredAndPagedItems(_items);
      totalRows = filteredItems.totalRows;
      var newRows = filteredItems.rows;

      groups = [];
      if (groupingInfos.length) {
        groups = extractGroups(newRows);
        if (groups.length) {
          addTotals(groups);
          newRows = flattenGroupedRows(groups);
        }
      }

      var diff = getRowDiffs(rows, newRows);

      rows = newRows;

      return diff;
    }

    function refresh() {
      if (suspend) {
        return;
      }

      var countBefore = rows.length;
      var totalRowsBefore = totalRows;

      var diff = recalc(items, filter); // pass as direct refs to avoid closure perf hit

      // if the current page is no longer valid, go to last page and recalc
      // we suffer a performance penalty here, but the main loop (recalc) remains highly optimized
      if (pagesize && totalRows < pagenum * pagesize) {
        pagenum = Math.max(0, Math.ceil(totalRows / pagesize) - 1);
        diff = recalc(items, filter);
      }
      
      updated = null;
      prevRefreshHints = refreshHints;
      refreshHints = {};

      onDataUpdate.notify({previous: countBefore, current: rows.length,rows: diff});

      if (totalRowsBefore != totalRows) {
        onPagingInfoChanged.notify(getPagingInfo(), null, self);
      }
      if (countBefore != rows.length) {
        onRowCountChanged.notify({previous: countBefore, current: rows.length}, null, self);
      }
      if (diff.length > 0) {
        onRowsChanged.notify({rows: diff}, null, self);
      }

    }

    /***
     * Wires the grid and the DataView together to keep row selection tied to item ids.
     * This is useful since, without it, the grid only knows about rows, so if the items
     * move around, the same rows stay selected instead of the selection moving along
     * with the items.
     *
     * NOTE:  This doesn't work with cell selection model.
     *
     * @param grid {Slick.Grid} The grid to sync selection with.
     * @param preserveHidden {Boolean} Whether to keep selected items that go out of the
     *     view due to them getting filtered out.
     * @param preserveHiddenOnSelectionChange {Boolean} Whether to keep selected items
     *     that are currently out of the view (see preserveHidden) as selected when selection
     *     changes.
     * @return {Slick.Event} An event that notifies when an internal list of selected row ids
     *     changes.  This is useful since, in combination with the above two options, it allows
     *     access to the full list selected row ids, and not just the ones visible to the grid.
     * @method syncGridSelection
     */
    function syncGridSelection(grid, preserveHidden, preserveHiddenOnSelectionChange) {
      var self = this;
      var inHandler;
      var selectedRowIds = self.mapRowsToIds(grid.getSelectedRows());
      var onSelectedRowIdsChanged = new Slick.Event();

      function setSelectedRowIds(rowIds) {
        if (selectedRowIds.join(",") == rowIds.join(",")) {
          return;
        }

        selectedRowIds = rowIds;

        onSelectedRowIdsChanged.notify({
          "grid": grid,
          "ids": selectedRowIds
        }, new Slick.EventData(), self);
      }

      function update() {
        if (selectedRowIds.length > 0) {
          inHandler = true;
          var selectedRows = self.mapIdsToRows(selectedRowIds);
          if (!preserveHidden) {
            setSelectedRowIds(self.mapRowsToIds(selectedRows));       
          }
          grid.setSelectedRows(selectedRows);
          inHandler = false;
        }
      }

      grid.onSelectedRowsChanged.subscribe(function(e, args) {
        if (inHandler) { return; }
        var newSelectedRowIds = self.mapRowsToIds(grid.getSelectedRows());
        if (!preserveHiddenOnSelectionChange || !grid.getOptions().multiSelect) {
          setSelectedRowIds(newSelectedRowIds);
        } else {
          // keep the ones that are hidden
          var existing = $.grep(selectedRowIds, function(id) { return self.getRowById(id) === undefined; });
          // add the newly selected ones
          setSelectedRowIds(existing.concat(newSelectedRowIds));
        }
      });

      this.onRowsChanged.subscribe(update);

      this.onRowCountChanged.subscribe(update);

      return onSelectedRowIdsChanged;
    }

    function syncGridCellCssStyles(grid, key) {
      var hashById;
      var inHandler;

      // since this method can be called after the cell styles have been set,
      // get the existing ones right away
      storeCellCssStyles(grid.getCellCssStyles(key));

      function storeCellCssStyles(hash) {
        hashById = {};
        for (var row in hash) {
          var id = rows[row][idProperty];
          hashById[id] = hash[row];
        }
      }

      function update() {
        if (hashById) {
          inHandler = true;
          ensureRowsByIdCache();
          var newHash = {};
          for (var id in hashById) {
            var row = rowsById[id];
            if (row != undefined) {
              newHash[row] = hashById[id];
            }
          }
          grid.setCellCssStyles(key, newHash);
          inHandler = false;
        }
      }

      grid.onCellCssStylesChanged.subscribe(function(e, args) {
        if (inHandler) { return; }
        if (key != args.key) { return; }
        if (args.hash) {
          storeCellCssStyles(args.hash);
        }
      });

      this.onRowsChanged.subscribe(update);

      this.onRowCountChanged.subscribe(update);
    }

    $.extend(this, {
      // methods
      "beginUpdate": beginUpdate,
      "endUpdate": endUpdate,
      "setPagingOptions": setPagingOptions,
      "getPagingInfo": getPagingInfo,
      "getItems": getItems,
      "getFilteredItems": getFilteredItems,
      "setItems": setItems,
      "setFilter": setFilter,
      "sort": sort,
      "fastSort": fastSort,
      "reSort": reSort,
      "setGrouping": setGrouping,
      "getGrouping": getGrouping,
      "groupBy": groupBy,
      "setAggregators": setAggregators,
      "collapseAllGroups": collapseAllGroups,
      "expandAllGroups": expandAllGroups,
      "collapseGroup": collapseGroup,
      "expandGroup": expandGroup,
      "getGroups": getGroups,
      "getIdxById": getIdxById,
      "getRowById": getRowById,
      "getItemById": getItemById,
      "getItemByIdx": getItemByIdx,
      "mapRowsToIds": mapRowsToIds,
      "mapIdsToRows": mapIdsToRows,
      "setRefreshHints": setRefreshHints,
      "setFilterArgs": setFilterArgs,
      "refresh": refresh,
      "updateItem": updateItem,
      "insertItem": insertItem,
      "addItem": addItem,
      "deleteItem": deleteItem,
      "syncGridSelection": syncGridSelection,
      "syncGridCellCssStyles": syncGridCellCssStyles,

      // data provider methods
      "getLength": getLength,
      "getItem": getItem,
      "getItemMetadata": getItemMetadata,

      // events
      "onRowCountChanged": onRowCountChanged,
      "onRowsChanged": onRowsChanged,
      "onPagingInfoChanged": onPagingInfoChanged,
      "onDataUpdate": onDataUpdate
    });
  }

  function AvgAggregator(field) {
    this.field_ = field;

    this.init = function () {
      this.count_ = 0;
      this.nonNullCount_ = 0;
      this.sum_ = 0;
    };

    this.accumulate = function (item) {
      var val = item[this.field_];
      this.count_++;
      if (val != null && val !== "" && val !== NaN) {
        this.nonNullCount_++;
        this.sum_ += parseFloat(val);
      }
    };

    this.storeResult = function (groupTotals) {
      if (!groupTotals.avg) {
        groupTotals.avg = {};
      }
      if (this.nonNullCount_ != 0) {
        groupTotals.avg[this.field_] = this.sum_ / this.nonNullCount_;
      }
    };
  }

  function MinAggregator(field) {
    this.field_ = field;

    this.init = function () {
      this.min_ = null;
    };

    this.accumulate = function (item) {
      var val = item[this.field_];
      if (val != null && val !== "" && val !== NaN) {
        if (this.min_ == null || val < this.min_) {
          this.min_ = val;
        }
      }
    };

    this.storeResult = function (groupTotals) {
      if (!groupTotals.min) {
        groupTotals.min = {};
      }
      groupTotals.min[this.field_] = this.min_;
    }
  }

  function MaxAggregator(field) {
    this.field_ = field;

    this.init = function () {
      this.max_ = null;
    };

    this.accumulate = function (item) {
      var val = item[this.field_];
      if (val != null && val !== "" && val !== NaN) {
        if (this.max_ == null || val > this.max_) {
          this.max_ = val;
        }
      }
    };

    this.storeResult = function (groupTotals) {
      if (!groupTotals.max) {
        groupTotals.max = {};
      }
      groupTotals.max[this.field_] = this.max_;
    }
  }

  function SumAggregator(field) {
    this.field_ = field;

    this.init = function () {
      this.sum_ = null;
    };

    this.accumulate = function (item) {
      var val = item[this.field_];
      if (val != null && val !== "" && val !== NaN) {
        this.sum_ += parseFloat(val);
      }
    };

    this.storeResult = function (groupTotals) {
      if (!groupTotals.sum) {
        groupTotals.sum = {};
      }
      groupTotals.sum[this.field_] = this.sum_;
    }
  }

  // TODO:  add more built-in aggregators
  // TODO:  merge common aggregators in one to prevent needles iterating

})(jQuery);


  }).apply(root, arguments);
});
}(this));

(function(root) {
define("slickgrid-utils", ["jquery","slick.grid","slick.dataview"], function() {
  return (function() {
/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */
window.URL = window.URL || window.webkitURL;
var slickGridSearchtimer = null;
function getDefaultGridConfig() {
    var defaultSettings = {
        header: {
            title: {
                cssClass : 'blue',
                icon : '',
                iconCssClass : 'blue'
            },
            icon: false,
            defaultControls: {
				collapseable: true,
				exportable: true,
				refreshable: false,
				searchable: true
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
                checkboxSelectable: false,
                detail: false,
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
                lazyLoading: false,
                actionCellPosition: 'end', //actionCellPosition indicates position of the settings icon whether it should be on row start and end 
                multiRowSelection: true,//This property will enable/disable selecting multiple rows of the grid
                                        //but the checkbox in the header should be removed by the client because as of now 
                                        //we don't have way in api to remove the checkbox in header 
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
            		text: 'No Records Found.'
            	},
            	error: {
            		type: 'error',
            		iconClasses: 'icon-warning',
            		text: 'Error - Please try again later.'
            	}
            }
        },
        footer : {
            pager : {
                options : {
                    pageSize : 50,
                    pageSizeSelect : [10, 50, 100, 200]
                }
            }
        }
    };
    return defaultSettings;
};

(function ($) {
    $.fn.contrailGrid = function (customGridConfig) {
    	if(contrail.checkIfExist(this.data('contrailGrid'))){
    		this.data('contrailGrid').destroy();
    	}
        this.addClass('contrail-grid');

        var gridConfig = {}, defaultGridConfig = getDefaultGridConfig(),
        	grid = null, dataView = null, pager = null,
        	gridDataSource, gridColumns, gridSortColumns = [], gridOptions,
        	autoRefreshInterval = false, searchColumns = [],
            currentSelectedRows = [],
            remoteConfig = {}, ajaxConfig,
            dvConfig = null, gridContainer = this,
            eventHandlerMap = {grid: {}, dataView: {}},
            scrolledStatus = {scrollLeft: 0, scrollTop: 0},
            adjustAllRowHeightTimer = null;

        // Extending the params with default settings
        $.extend(true, gridConfig, defaultGridConfig, customGridConfig);

        gridDataSource = gridConfig.body.dataSource;
        gridColumns = gridConfig.columnHeader.columns;
        gridOptions = gridConfig.body.options;
        gridConfig.footer = ($.isEmptyObject(gridConfig.footer)) ? false : gridConfig.footer;

        if(contrail.checkIfKeyExistInObject(true, customGridConfig, 'footer.pager.options.pageSizeSelect')) {
            gridConfig.footer.pager.options.pageSizeSelect = customGridConfig.footer.pager.options.pageSizeSelect;
        }

        if (gridOptions.fixedRowHeight != false && _.isNumber(gridOptions.fixedRowHeight)) {
            gridOptions.rowHeight = gridOptions.fixedRowHeight;
        }

        //Local Datasource means the client-side data with client-side pagination if footer initialized
        if (contrail.checkIfExist(gridDataSource.data)) {
            dataView = new ContrailDataView();
            initContrailGrid(dataView);
            initClientSidePagination();
            initGridFooter();
            initDataView(gridConfig);
            dataView.setSearchFilter(searchColumns, searchFilter);
            dataView.setData(gridDataSource.data);
            performSort(gridSortColumns);
            if(dataView.getLength() == 0){
                emptyGridHandler();
            }
            else{
            	gridContainer.data('contrailGrid').removeGridMessage();
            }
        } else if (contrail.checkIfExist(gridDataSource.remote)) {
            ajaxConfig = gridDataSource.remote.ajaxConfig;
            if(contrail.checkIfExist(ajaxConfig) && contrail.checkIfExist(ajaxConfig.url)) {
            	if(gridDataSource.remote.serverSidePagination) {
                    initContrailGrid([]);
                    initGridFooter(gridDataSource.remote.serverSidePagination);
                } else {
                    dvConfig = {remote: remoteConfig};
                    $.extend(true, remoteConfig, gridDataSource.remote, {
                        initCallback: function () {
                            if(contrail.checkIfFunction(gridDataSource.events.onRequestStartCB)) {
                                gridDataSource.events.onRequestStartCB();
                            }
                        },
                        successCallback: function (response) {
                            if(response.length == 0){
                                emptyGridHandler();
                            } else {
                                if(gridContainer.data('contrailGrid') != null) {
                                    gridContainer.data('contrailGrid').removeGridMessage();
                                }
                                gridContainer.find('grid-footer').removeClass('hide');
                            }
                            if(contrail.checkIfFunction(gridDataSource.events.onRequestSuccessCB)) {
                                gridDataSource.events.onRequestSuccessCB(response);
                            }
                            initClientSidePagination();
                            initGridFooter();
                            initDataView(gridConfig);
                            dataView.setSearchFilter(searchColumns, searchFilter);
                            dataView.setData(response);
                            performSort(gridSortColumns);
                        },
                        refreshSuccessCallback: function (response, refreshDataOnly) {
                            if(response.length == 0){
                                emptyGridHandler();
                            }
                            if(contrail.checkIfFunction(gridDataSource.events.onRequestSuccessCB)) {
                                gridDataSource.events.onRequestSuccessCB(response);
                            }
                            dataView.setData(response);
                            performSort(gridSortColumns);
                            if(gridConfig.header.defaultControls.refreshable){
                            	setTimeout(function(){
                            		gridContainer.find('.link-refreshable i').removeClass('icon-spin icon-spinner').addClass('icon-repeat');
                            	},1000);
                            }
                        },
                        failureCallback: function (xhr) {
                            stopAutoRefresh();
                            var errorMsg = contrail.parseErrorMsgFromXHR(xhr);
                            if(xhr.statusText != 'abort') {
                                errorGridHandler(errorMsg);
                            }
                            if(contrail.checkIfFunction(gridDataSource.events.onRequestErrorCB)) {
                                gridDataSource.events.onRequestErrorCB();
                            }
                        }
                    });
                    dataView = new ContrailDataView(dvConfig);
                    initContrailGrid(dataView);
                }
            }
        } else if(contrail.checkIfExist(gridDataSource.dataView)) {
            dataView = gridDataSource.dataView;
            var dataViewData = dataView.getItems();
            dataView.setData([]);
            initContrailGrid(dataView);
            initDataView(gridConfig);
            dataView.setSearchFilter(searchColumns, searchFilter);
            initClientSidePagination();
            initGridFooter();
            dataView.setData(dataViewData);
            performSort(gridSortColumns);
        }

        function searchFilter(item, args) {
            var returnFlag = false;

            if (args.searchString == "") {
                returnFlag = true;
            } else {
                $.each(args.searchColumns, function (key, val) {
                    var queryString = String(item[val.field]);
                    if (contrail.checkIfFunction(val.formatter)) {
                        queryString = String(val.formatter(0, 0, 0, 0, item));
                    }
                    if (contrail.checkIfFunction(val.searchFn)) {
                        queryString = String(val.searchFn(item));
                    }

                    var argSearchStr = args.searchString.trim().toLowerCase(),
                        queryStrLower = queryString.toLowerCase();

                    //extending search to comma separted input values
                    if (argSearchStr.indexOf(',') === -1) {
                        if (queryStrLower.indexOf(argSearchStr) != -1) {
                            returnFlag = true;
                        }
                    } else {
                        var searchStrArray = args.searchString.split(',');
                        for (var i = 0; i < searchStrArray.length; i++) {
                            var searchStr = searchStrArray[i].trim().toLowerCase();
                            if (searchStrArray[i] != '' && (queryStrLower.indexOf(searchStr)) != -1) {
                                returnFlag = true;
                            }
                        }
                    }
                });
            }
            return returnFlag;
        };

        function startAutoRefresh(refreshPeriod){
            if(refreshPeriod && !autoRefreshInterval){
	        	autoRefreshInterval = setInterval(function(){
	        		if(gridContainer.find('.grid-body').is(':visible')){
	        			gridContainer.data('contrailGrid').refreshData();
	        		}
	        		else{
	        			stopAutoRefresh();
	        		}
	        	},refreshPeriod*1000);
        	}
        }
        function stopAutoRefresh(){
        	if(autoRefreshInterval){
        		clearInterval(autoRefreshInterval);
        		autoRefreshInterval = false;
        	}
        }

        function initContrailGrid(dataObject){
            var checkboxSelector = new Slick.CheckboxSelectColumn({
                cssClass: "slick-cell-checkboxsel"
            });
            initGridHeader();
            initGridBodyOptions(checkboxSelector);
            gridContainer.append('<div class="grid-body"></div>');
            if(gridOptions.autoHeight == false){
            	gridContainer.find('.grid-body').height(gridOptions.gridHeight);
            }
            grid = new Slick.Grid(gridContainer.find('.grid-body'), dataObject, gridColumns, gridOptions);
            grid.setSelectionModel(new Slick.RowSelectionModel({selectActiveRow: false}));
            grid.registerPlugin(checkboxSelector);
            gridContainer.append('<div class="grid-load-status hide"></div>');
            initGridEvents();
            setDataObject4ContrailGrid();
            gridContainer.data('contrailGrid').showGridMessage('loading');
        };

        function initGridHeader() {
            // Grid Header - Title + Other Actions like Expand/Collapse, Search and Custom actions
            if (gridConfig.header) {
                generateGridHeaderTemplate(gridConfig.header);

                gridContainer.find('.grid-widget-header .widget-toolbar-icon').on('click', function(e) {
                    if(!$(this).hasClass('disabled-link')) {
                        var command = $(this).attr('data-action'),
                            gridHeader = $(this).parents(".grid-header");

                        switch (command) {
                            case 'search':
                                gridHeader.find('.link-searchbox').toggle();
                                gridHeader.find('.input-searchbox').toggle();
                                if (gridHeader.find('.input-searchbox').is(':visible')) {
                                    gridHeader.find('.input-searchbox input').focus();
                                } else {
                                    gridHeader.find('.input-searchbox input').val('');
                                }
                                e.stopPropagation();
                                break;
                            case 'multiselect':
                                var linkMultiselectBox = $(this).parent().find('.link-multiselectbox'),
                                    inputMultiselectBox = $(this).parent().find('.input-multiselectbox');

                                linkMultiselectBox.toggle();
                                inputMultiselectBox.toggle();
                                if (inputMultiselectBox.is(':visible')) {
                                    inputMultiselectBox.find('.input-icon').data('contrailCheckedMultiselect').open();
                                }
                                e.stopPropagation();
                                break;
                            case 'refresh':
                                gridContainer.find('.link-refreshable i').removeClass('icon-repeat').addClass('icon-spin icon-spinner');
                                gridContainer.data('contrailGrid').refreshData();
                                break;
                            case 'export':
                                var gridDSConfig = gridDataSource,
                                    gridData = [], dv;

                                gridContainer.find('a[data-action="export"] i').removeClass('icon-download-alt').addClass('icon-spin icon-spinner');
                                gridContainer.find('a[data-action="export"]').prop('title', 'Exporting...').data('action', 'exporting').addClass('blue');
                                if (contrail.checkIfExist(gridDSConfig.remote) && gridDSConfig.remote.serverSidePagination) {
                                    var exportCB = gridDSConfig.remote.exportFunction;
                                    if (exportCB != null) {
                                        exportCB(gridConfig, gridContainer);
                                    }
                                } else {
                                    dv = gridContainer.data('contrailGrid')._dataView;
                                    gridData = dv.getItems();
                                    exportGridData2CSV(gridConfig, gridData);
                                    setTimeout(function () {
                                        gridContainer.find('a[data-action="export"] i').addClass('icon-download-alt').removeClass('icon-spin icon-spinner');
                                        gridContainer.find('a[data-action="export"]').prop('title', 'Export as CSV').data('action', 'export').removeClass('blue');
                                    }, 500);
                                }
                                break;
                            case 'collapse':
                                gridHeader.find('i.collapse-icon').toggleClass('icon-chevron-up').toggleClass('icon-chevron-down');

                                if (gridHeader.find('i.collapse-icon').hasClass('icon-chevron-up')) {
                                    gridContainer.children().removeClass('collapsed');
                                } else if (gridHeader.find('i.collapse-icon').hasClass('icon-chevron-down')) {
                                    gridContainer.children().addClass('collapsed');
                                    gridHeader.show();
                                }
                                break;
                        }
                    }
                });

                $.each(gridColumns, function(key,val){
                	// Setting searchable:true for columns wherever necessary
                	if(gridConfig.header.defaultControls.searchable){
                		if(typeof val.searchable == 'undefined' || val.searchable != false)
                            searchColumns.push(val);
                	}
                    if(!contrail.checkIfExist(val.tooltip)) {
                        val.toolTip = val.name;
                    }
                    if (gridOptions.fixedRowHeight != false && _.isNumber(gridOptions.fixedRowHeight)) {
                        val.cssClass = (contrail.checkIfExist(val.cssClass) ? val.cssClass + ' ' : '') +
                        'fixed-row-height height-' + (gridOptions.fixedRowHeight - 10);
                    }
                });
            }

            $.each(gridColumns, function (key, val) {
                // Setting sortable:true for columns wherever necessary
                if(gridOptions.sortable != false){
                    if(!contrail.checkIfExist(val.sortable)){
                        gridColumns[key].sortable = true;
                    }
                    if(contrail.checkIfExist(gridOptions.sortable.defaultSortCols) && contrail.checkIfExist(gridOptions.sortable.defaultSortCols[val.field])) {
                        gridOptions.sortable.defaultSortCols[val.field].sortCol = val;
                    }
                }
                else{
                    gridColumns[key].sortable = false;
                }

                if(!contrail.checkIfExist(gridColumns[key].id)){
                    gridColumns[key].id = val.field + '_' + key;
                }
            });
        };

        function initGridBodyOptions(checkboxSelector) {
        	if(contrail.checkIfExist(gridOptions)){
        		var columns = [];
	            // Adds checkbox to all rows and header for select all functionality
	            if(gridOptions.checkboxSelectable != false) {
	                columns = [];
                    columns.push($.extend(true, {}, checkboxSelector.getColumnDefinition(), {
                        formatter: function(r, c, v, cd, dc) {
                            var selectedRows = (contrail.checkIfExist(grid)) ? grid.getSelectedRows() : [];
                            var enabled = true;
                            if(contrail.checkIfFunction(gridOptions.checkboxSelectable.enableRowCheckbox)){
                                enabled = gridOptions.checkboxSelectable.enableRowCheckbox(dc);
                            }
                            if (enabled) {
                                return (selectedRows.indexOf(r) == -1) ?
                                    '<input type="checkbox" class="ace-input rowCheckbox" value="' + r + '"/> <span class="ace-lbl"></span>' :
                                    '<input type="checkbox" class="ace-input rowCheckbox" checked="checked" value="' + r + '"/> <span class="ace-lbl"></span>';

                            }
                            else {
                                return '<input type="checkbox" class="ace-input rowCheckbox" value="' + r + '" disabled=true/> <span class="ace-lbl"></span>';
                            }
                        },
                        name: '<input type="checkbox" class="ace-input headerRowCheckbox" disabled=true/> <span class="ace-lbl"></span>'
                    }));

                    columns = columns.concat(gridColumns);
	                gridColumns = columns;
	            }

	            if (gridOptions.detail != false) {
	                columns = [];
	                columns.push({
	                    focusable: true,
	                    formatter: function(r, c, v, cd, dc) {
	                        return '<i class="icon-caret-right toggleDetailIcon slick-row-detail-icon"></i>';
	                    },
	                    id: "_detail_row_icon",
	                    rerenderOnResize: false,
	                    resizable: false,
	                    selectable: true,
	                    sortable: false,
	                    width: 30,
	                    searchable: false,
	                    exportConfig: {
	                        allow: false
	                    },
	                    events: {
	            			onClick: function(e,dc){
	            				var target = e.target;
                                if($(target).hasClass('icon-caret-right')){

                                	if(!$(target).parents('.slick-row-master').next().hasClass('slick-row-detail')){
	                                	var cellSpaceColumn = 0,
	                                    	cellSpaceRow = gridColumns.length - 1;

	                                    //if (gridOptions.checkboxSelectable != false) {
	                                    //    cellSpaceColumn++;
	                                    //}

	                                    $(target).parents('.slick-row-master').after(' \
	            	            				<div class="ui-widget-content slick-row slick-row-detail" data-cgrid="' + $(target).parents('.slick-row-master').data('cgrid') + '"> \
	            	            					<div class="slick-cell l' + cellSpaceColumn + ' r' + cellSpaceRow + '"> \
	            		            					<div class="slick-row-detail-container"> \
	            		            						<div class="slick-row-detail-template-' + $(target).parents('.slick-row-master').data('cgrid') + '"></div> \
	            	            						</div> \
	            	            					</div> \
	            	            				</div>');

	                                    $(target).parents('.slick-row-master').next('.slick-row-detail').find('.slick-row-detail-container').show();

	                                    // onInit called after building a template
	                                	if(contrail.checkIfFunction(gridOptions.detail.onInit)){
	                                		e['detailRow'] = $(target).parents('.slick-row-master').next().find('.slick-row-detail-container');
	                                		gridOptions.detail.onInit(e,dc);
	                                    }
	                                	refreshDetailTemplateById($(target).parents('.slick-row-master').data('cgrid'));
                                	}
                                	else{
                                		$(target).parents('.slick-row-master').next('.slick-row-detail').show();
                                	}

                                    if(contrail.checkIfFunction(gridOptions.detail.onExpand)){
                                    	gridOptions.detail.onExpand(e,dc);
                                    }
                                    $(target).removeClass('icon-caret-right').addClass('icon-caret-down');

                                    var slickRowDetail = $(target).parents('.slick-row-master').next('.slick-row-detail'),
                                        slickRowDetailHeight = slickRowDetail.height(),
                                        detailContainerHeight = slickRowDetail.find('.slick-row-detail-container').height();

                                    if (Math.abs(slickRowDetailHeight-detailContainerHeight) > 10) {
                                        gridContainer.data('contrailGrid').adjustDetailRowHeight(slickRowDetail.data('cgrid'))
                                    }
                                }
                                else if($(target).hasClass('icon-caret-down')){
                                    $(target).parents('.slick-row-master').next('.slick-row-detail').hide();

                                    if(contrail.checkIfFunction(gridOptions.detail.onCollapse)){
                                    	gridOptions.detail.onCollapse(e,dc);
                                    }
                                    $(target).removeClass('icon-caret-down').addClass('icon-caret-right');
                                }
	            			}
	            		}
	                });
	                columns = columns.concat(gridColumns);
	                gridColumns = columns;

	                gridContainer.find('.slick-row-detail').live('click', function(){
	                	var rowId = $(this).data('cgrid');
	                	setTimeout(function(){
	                	    if(gridContainer.data('contrailGrid') != null)
	                	        gridContainer.data('contrailGrid').adjustDetailRowHeight(rowId);
	                	},100);
	                });
	            }

                if (gridOptions.actionCell != false) {
                    columns = [];

                    if(gridOptions.actionCell instanceof Array || contrail.checkIfFunction(gridOptions.actionCell)) {
                        var optionList = gridOptions.actionCell
                        gridOptions.actionCell = {
                            type: 'dropdown',
                            optionList: optionList
                        };
                    }

                    if(gridOptions.actionCell.type == 'dropdown' && gridOptions.actionCell.optionList.length > 0){
                        columns.push({
                            id: 'slick_action_cog',
                            field:"",
                            cssClass: 'action-cog-cell',
                            rerenderOnResize: false,
                            width: 20,
                            resizable: false,
                            formatter: function(r, c, v, cd, dc) {
                                var actionCellArray = [];
                                if(contrail.checkIfFunction(gridOptions.actionCell.optionList)){
                                    actionCellArray = gridOptions.actionCell.optionList(dc);
                                } else{
                                    actionCellArray = gridOptions.actionCell.optionList;
                                }

                                return (actionCellArray.length > 0) ? '<i class="icon-cog icon-only bigger-110 grid-action-dropdown"></i>' : '';
                            },
                            searchable: false,
                            sortable: false,
                            exportConfig: {
                                allow: false
                            }
                        });
                    }
                    else if(gridOptions.actionCell.type == 'link') {
                        columns.push({
                            id: 'slick_action_link',
                            field:"",
                            cssClass: 'action-link-cell',
                            rerenderOnResize: false,
                            width: 20,
                            resizable: false,
                            formatter: function(r, c, v, cd, dc) {
                                return '<i class="' + gridOptions.actionCell.iconClass + ' icon-only grid-action-link"></i>';
                            },
                            searchable: false,
                            sortable: false,
                            exportConfig: {
                                allow: false
                            }
                        });
                    }
                    if(gridOptions.actionCellPosition == 'start') {
                        columns = columns.concat(gridColumns);
                    } else {
                        columns = gridColumns.concat(columns);
                    }
                    gridColumns = columns;
                }

                if(contrail.checkIfExist(gridOptions.sortable.defaultSortCols)) {
                    $.each(gridOptions.sortable.defaultSortCols, function (defaultSortColKey, defaultSortColValue) {
                        gridSortColumns.push(defaultSortColValue);
                    });
                }
        	}
        };

        function refreshDetailTemplateById(id){
        	var source = gridOptions.detail.template,
                templateKey = gridContainer.prop('id') + '-grid-detail-template';
            source = source.replace(/ }}/g, "}}");
            source = source.replace(/{{ /g, "{{");

            var template = contrail.getTemplate4Source(source, templateKey),
            	dc = dataView.getItemById(id);

            if(contrail.checkIfExist(dc)){
            	if(contrail.checkIfExist(gridOptions.detail.templateConfig)){
	            	gridContainer.find('.slick-row-detail-template-' + id).html(template({dc:dc, templateConfig: gridOptions.detail.templateConfig}));
            	} else{
            		gridContainer.find('.slick-row-detail-template-' + id).html(template(dc));
            	}
	            	gridContainer.data('contrailGrid').adjustDetailRowHeight(id);
            }
            else {
            	gridContainer.find('.slick-row-detail-template-' + id).parents('.slick-row-detail').remove();
            }
        }

        function initGridEvents() {

        	eventHandlerMap.grid['onScroll'] = function(e, args){
        		if(scrolledStatus.scrollLeft != args.scrollLeft || scrolledStatus.scrollTop != args.scrollTop){
                	gridContainer.data('contrailGrid').adjustAllRowHeight();
                	scrolledStatus.scrollLeft = args.scrollLeft;
                	scrolledStatus.scrollTop = args.scrollTop;
            	}
        	};

        	grid['onScroll'].subscribe(eventHandlerMap.grid['onScroll']);

            eventHandlerMap.grid['onSelectedRowsChanged'] = function(e, args){
                var onNothingChecked = contrail.checkIfFunction(gridOptions.checkboxSelectable.onNothingChecked) ? gridOptions.checkboxSelectable.onNothingChecked : null,
                    onSomethingChecked = contrail.checkIfFunction(gridOptions.checkboxSelectable.onSomethingChecked) ? gridOptions.checkboxSelectable.onSomethingChecked : null,
                    onEverythingChecked = contrail.checkIfFunction(gridOptions.checkboxSelectable.onEverythingChecked) ? gridOptions.checkboxSelectable.onEverythingChecked : null;

                var selectedRowLength = args.rows.length;

                if (selectedRowLength == 0) {
                    (contrail.checkIfExist(onNothingChecked) ? onNothingChecked(e) : '');
                }
                else {
                    (contrail.checkIfExist(onSomethingChecked) ? onSomethingChecked(e) : '');

                    if (selectedRowLength == grid.getDataLength()) {
                        (contrail.checkIfExist(onEverythingChecked) ? onEverythingChecked(e) : '');
                    }
                }
                gridContainer.data('contrailGrid').refreshView();
                if (gridOptions.multiRowSelection != true) {
                    gridContainer.find('.slick-cell-checkboxsel').find('input.rowCheckbox:visible').attr('checked',false);
                    $(gridContainer.find('.slick-cell-checkboxsel').find('input.rowCheckbox:visible')[args.rows.pop()]).attr('checked',true);
                }
            };

            grid['onSelectedRowsChanged'].subscribe(eventHandlerMap.grid['onSelectedRowsChanged']);

            eventHandlerMap.grid['onHeaderClick'] = function(e, args){
                if ($(e.target).is(":checkbox")) {

                    if ($(e.target).is(":checked")) {
                        gridContainer.data('contrailGrid').setAllCheckedRows('current-page');

                        var pagingInfo = dataView.getPagingInfo(),
                            currentPageRecords = (pagingInfo.pageSize * (pagingInfo.pageNum + 1)) < pagingInfo.totalRows ? pagingInfo.pageSize : (pagingInfo.totalRows - (pagingInfo.pageSize * (pagingInfo.pageNum)))

                        if(pagingInfo.totalPages > 1 && !gridContainer.data('contrailGrid')._gridStates.allPagesDataChecked) {
                            gridContainer.find('.grid-check-all-info').remove();
                            gridContainer.find('.slick-header').after('<div class="alert alert-info grid-info grid-check-all-info"> ' +
                            '<button type="button" class="close" data-dismiss="alert">&times;</button>' +
                            '<strong>' + currentPageRecords + ' records checked.</strong> <a class="check-all-link">Click here to check all ' + pagingInfo.totalRows + ' records</a>' +
                            '</div>');

                            gridContainer.find('.check-all-link')
                                .off('click')
                                .on('click', function(e) {
                                    gridContainer.data('contrailGrid').setAllCheckedRows('all-page');
                                    gridContainer.data('contrailGrid')._gridStates.allPagesDataChecked = true;

                                    gridContainer.find('.grid-check-all-info').remove();
                                    gridContainer.find('.slick-header').after('<div class="alert alert-info grid-info grid-check-all-info"> ' +
                                    '<button type="button" class="close" data-dismiss="alert">&times;</button>' +
                                    '<strong>' + pagingInfo.totalRows + ' records checked.</strong> <a class="clear-selection-link">Click here to clear selection</a>' +
                                    '</div>');

                                    gridContainer.find('.clear-selection-link')
                                        .off('click')
                                        .on('click', function(e) {
                                            grid.setSelectedRows([]);
                                            gridContainer.find('.grid-check-all-info').remove();
                                            gridContainer.data('contrailGrid')._gridStates.allPagesDataChecked = false;
                                        })
                                });
                        }

                    } else {
                        grid.setSelectedRows([]);
                        gridContainer.data('contrailGrid')._gridStates.allPagesDataChecked = false;
                        gridContainer.find('.grid-check-all-info').remove();
                    }

                    e.stopPropagation();
                    e.stopImmediatePropagation();
                }
            };
            
            grid['onHeaderClick'].subscribe(eventHandlerMap.grid['onHeaderClick']);

        	eventHandlerMap.grid['onClick'] = function (e, args) {
            	var column = grid.getColumns()[args.cell],
            		rowData = grid.getDataItem(args.row);
                gridContainer.data('contrailGrid').selectedRow = args.row;
                gridContainer.data('contrailGrid').selectedCell = args.cell;

                if(contrail.checkIfExist(gridConfig.body.events) && contrail.checkIfFunction(gridConfig.body.events.onClick)){
                	gridConfig.body.events.onClick(e,rowData);
                }

                if(contrail.checkIfExist(column.events) && contrail.checkIfFunction(column.events.onClick)){
                	column.events.onClick(e,rowData);
                }

                if(gridOptions.rowSelectable){
                    if(!gridContainer.find('.slick_row_' + rowData.cgrid).hasClass('selected_row')){
                        gridContainer.find('.selected_row').removeClass('selected_row');
                        gridContainer.find('.slick_row_' + rowData.cgrid).addClass('selected_row');
                    }
                }

                setTimeout(function(){
                    if(gridContainer.data('contrailGrid') != null)
                        gridContainer.data('contrailGrid').adjustRowHeight(rowData.cgrid);
                },50);

                if ($(e.target).hasClass("grid-action-dropdown")) {
                    if($('#' + gridContainer.prop('id') + '-action-menu-' + args.row).is(':visible')){
                        $('#' + gridContainer.prop('id') + '-action-menu-' + args.row).remove();
                    } else {
                        $('.grid-action-menu').remove();
                        var actionCellArray = [];
                        if(contrail.checkIfFunction(gridOptions.actionCell.optionList)){
                            actionCellArray = gridOptions.actionCell.optionList(rowData);
                        } else{
                            actionCellArray = gridOptions.actionCell.optionList;
                        }

                        //$('#' + gridContainer.prop('id') + '-action-menu').remove();
                        addGridRowActionDroplist(actionCellArray, gridContainer, args.row,$(e.target));
                        var offset = $(e.target).offset(),actionCellStyle = '';
                        if(gridOptions.actionCellPosition == 'start') {
                            actionCellStyle = 'top:'+(offset.top + 20) + 'px' + ';right:auto !important;left:'+offset.left+'px !important;';   
                        } else {
                            actionCellStyle = 'top:'+(offset.top + 20) + 'px' + ';left:'+(offset.left - 155)+'px;';
                        }
                        $('#' + gridContainer.prop('id') + '-action-menu-' + args.row).attr('style',function(idx,obj){
                            if (obj != null) {
                                return obj + actionCellStyle;
                            } else {
                                return actionCellStyle;
                            }
                        }).show(function() {
                            var dropdownHeight = $('#' + gridContainer.prop('id') + '-action-menu-' + args.row).height(),
                                windowHeight = $(window).height(),
                                currentScrollPosition = $(window).scrollTop(),
                                actionScrollPosition = offset.top + 20 - currentScrollPosition;

                            if((actionScrollPosition + dropdownHeight) > windowHeight) {
                                window.scrollTo(0, (actionScrollPosition + dropdownHeight) - windowHeight + currentScrollPosition);
                            }
                        });
                        e.stopPropagation();
                        initOnClickDocument('#' + gridContainer.prop('id') + '-action-menu-' + args.row,function(){
                            $('#' + gridContainer.prop('id') + '-action-menu-' + args.row).hide();
                        });
                    }
                }

                if ($(e.target).hasClass("grid-action-link")) {
                    if(gridOptions.actionCell.type == 'link') {
                        gridOptions.actionCell.onclick(e, args);
                    }
                }
            };

            grid['onClick'].subscribe(eventHandlerMap.grid['onClick']);

        };

        function initOnClickDocument(containerIdentifier, callback) {
        	$(document).on('click',function (e) {
        		if(!$(e.target).closest(gridContainer.find(containerIdentifier)).length) {
   			    	callback(e);
   			    }
    		});
        };
        
        function initDataView(gridConfig) {
            eventHandlerMap.dataView['onDataUpdate'] = function(e, args) {
                    //Display filtered count in grid header
                    if(gridConfig.header.showFilteredCntInHeader) {
                        var totalRowCnt,filteredRowCnt;
                        if(grid.getData() != null && grid.getData().getPagingInfo() != null) {
                            totalRowCnt  = grid.getData().getItems().length;
                            filteredRowCnt = grid.getData().getPagingInfo()['totalRows']
                        }
                        if(totalRowCnt == filteredRowCnt) {
                            gridContainer.find('.grid-header-text').text(gridConfig.header.title.text + " (" + totalRowCnt + ")");
                        } else {
                            gridContainer.find('.grid-header-text').text(gridConfig.header.title.text + " (" + filteredRowCnt + " of " + totalRowCnt + ")");
                        }
                    }
                    //Refresh the grid only if it's not destroyed
                    if($(gridContainer).data('contrailGrid') != null && (args.previous != args.current || args.rows.length > 0)) {
                        grid.invalidateAllRows();
                        grid.updateRowCount();
                        grid.render();

                        //onRowCount Changed
                        if (args.previous != args.current) {
                            gridContainer.data('contrailGrid').removeGridMessage();
                            if(dataView.getLength() == 0){
                                emptyGridHandler();
                                gridContainer.find('.slick-row-detail').remove();
                            } else {
                                gridContainer.find('.grid-footer').removeClass('hide');
                                onDataGridHandler();
                            }
                        }

                        //onRows Changed
                        if (args.rows.length > 0) {
                            if(contrail.checkIfFunction(gridDataSource.events.onDataBoundCB)) {
                                gridDataSource.events.onDataBoundCB();
                            }

                            // Adjusting the row height for all rows
                            gridContainer.data('contrailGrid').adjustAllRowHeight();

                            // Assigning odd and even classes to take care of coloring effect on alternate rows
                            gridContainer.data('contrailGrid').adjustGridAlternateColors();

                            // Refreshing the detail view
                            gridContainer.data('contrailGrid').refreshDetailView();
                        }

                        if(contrail.checkIfFunction(gridDataSource.events.onDataUpdateCB)) {
                            gridDataSource.events.onDataUpdateCB(e, args);
                        }
                    } else if (dataView.getLength() == 0){
                        emptyGridHandler();
                        gridContainer.find('.slick-row-detail').remove();
                    }
            };

            $.each(eventHandlerMap.dataView, function(key, val){
            	dataView[key].subscribe(val);
            });
        };

        function initClientSidePagination() {
            eventHandlerMap.grid['onSort'] = function (e, args) {
                performSort(args.sortCols);
                grid.setSelectedRows([]);
        	};

        	grid['onSort'].subscribe(eventHandlerMap.grid['onSort']);

            initSearchBox();
        };

        function performSort(cols) {
            if(cols.length > 0) {
                dataView.sort(function (dataRow1, dataRow2) {
                    for (var i = 0, l = cols.length; i < l; i++) {
                        var field = cols[i].sortCol.field;
                        var sortField = cols[i].sortCol.sortField;
                        if(sortField != null) {
                            field = sortField;
                        }
                        var sign = cols[i].sortAsc ? 1 : -1;
                        var result = 0;
                        var value1 = (contrail.checkIfExist(cols[i].sortCol.sortable.sortBy) && cols[i].sortCol.sortable.sortBy == 'formattedValue') ? cols[i].sortCol.formatter('', '', '', '', dataRow1) : dataRow1[field],
                                value2 = (contrail.checkIfExist(cols[i].sortCol.sortable.sortBy) && cols[i].sortCol.sortable.sortBy == 'formattedValue') ? cols[i].sortCol.formatter('', '', '', '', dataRow2) : dataRow2[field];
                        if(cols[i].sortCol.sorter != null){
                            result = cols[i].sortCol.sorter(value1, value2, sign); // sorter property from column definition will be called if present
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

        function initSearchBox() {
            // Search Textbox Keyup
            gridContainer.find('.input-searchbox input').on('keyup', function(e) {
            	var searchValue = this.value;
            	if(slickGridSearchtimer) {
                    window.clearTimeout(slickGridSearchtimer);
            	}
            	slickGridSearchtimer = setTimeout(function(){
                    if(searchValue == gridContainer.find('.input-searchbox input').val() && searchValue != null) {
                    	dataView.setFilterArgs({
                            searchString: searchValue,
                            searchColumns: searchColumns
                        });
                        dataView.setFilter(searchFilter);
                        dataView.refresh();
                        if(dataView.getFilteredItems().length == 0) {
                            gridContainer.data('contrailGrid').showGridMessage('empty', 'No records found for "' + searchValue + '"')
                        }
                        gridContainer.find('.slick-row-detail').remove();
                        gridContainer.find('.input-searchbox input').focus();
                    }
                },500);

            });

            initOnClickDocument('.input-searchbox',function(e){
        	    if(gridContainer.find('.input-searchbox').is(":visible") && gridContainer.find('.input-searchbox').find('input').val() == '') {
                	gridContainer.find('.input-searchbox').hide();
                	gridContainer.find('.link-searchbox').show();
                }
            });
        }

        function initGridFooter(serverSidePagination) {
            if(gridContainer.data('contrailGrid') == null) {
                return;
            }
            if(gridConfig.footer != false) {
                gridContainer.append('<div class="grid-footer hide"></div>');

                gridContainer.find('.grid-footer').append('<div class="slick-pager"> \
                		<span class="slick-pager-nav"> \
                			<span class="pager-control"><i class="icon-step-backward icon-disabled pager-control-first"></i></span>\
                			<span class="pager-control"> <i class="icon-backward icon-disabled pager-control-prev"></i></span> \
                			<span class="pager-page-info"><div class="csg-current-page"></div> of <span class="csg-total-page-count"></span></span> \
                			<span class="pager-control"> <i class="icon-forward icon-disabled pager-control-next"></i></span> \
                			<span class="pager-control"> <i class="icon-step-forward icon-disabled pager-control-last"></i></span> \
                		</span> \
                		<span class="slick-pager-info"></span>\
                		<span class="slick-pager-sizes"><div class="csg-pager-sizes"></div></span>\
                	</div>');

                if(serverSidePagination) {
                    pager = new Slick.Controls.EnhancementPager({
                        gridContainer: gridContainer,
                        container: $(gridContainer.find('.grid-footer')),
                        gridConfig: gridConfig,
                        remoteUrl: gridDataSource.remote.ajaxConfig.url,
                        datagrid: grid,
                        params: gridDataSource.remote.ajaxConfig.data,
                        events: gridDataSource.events,
                        options: gridConfig.footer.pager.options
                    });
                    gridContainer.find('.slick-pager-sizes').hide();
                } else {
                	if(dataView.getLength() != 0){
                    	gridContainer.find('.grid-footer').removeClass('hide');
                    }
                    pager = new SlickGridPager(dataView, gridContainer, gridConfig.footer.pager.options);
                    pager.init();
                }
            }
            gridContainer.data("contrailGrid")._pager = pager;
            startAutoRefresh(gridOptions.autoRefresh);
        };

        function setDataObject4ContrailGrid() {
            gridContainer.data('contrailGrid', {
                _grid: grid,
                _dataView: dataView,
                _eventHandlerMap: eventHandlerMap,
                _pager: pager,
                _gridStates: {
                    allPagesDataChecked: false,
                    currentPageDataChecked: false
                },
                expand: function(){
                	gridContainer.find('i.collapse-icon').addClass('icon-chevron-up').removeClass('icon-chevron-down');
            		gridContainer.children().removeClass('collapsed');
                },
                collapse: function(){
                	gridContainer.find('i.collapse-icon').removeClass('icon-chevron-up').addClass('icon-chevron-down');
                    gridContainer.children().addClass('collapsed');
                    gridContainer.find('.grid-header').show();
                },
                /*
                 * Returns an array of data of the checked rows via checkbox when checkboxSelectable is set to true
                 */
                getCheckedRows: function(){
                    if (gridContainer.data('contrailGrid')._gridStates.allPagesDataChecked) {
                        return dataView.getFilteredItems();
                    } else {
                        var selectedRows = grid.getSelectedRows(),
                            returnValue = [];
                        $.each(selectedRows, function(selectedRowKey, selectedRowValue){
                            returnValue.push(grid.getDataItem(selectedRowValue));
                        });
                        return returnValue;
                    }
                },
                /*
                 * Sets the checked rows of the rows based on rowIndices
                 */
                setCheckedRows: function(rowIndices) {
                    grid.setSelectedRows(rowIndices);
                },
                /*
                 * Set All Checked Rows based on type == 'current-page' and 'all-page'
                 */
                setAllCheckedRows: function(type) {
                    var rows = [], dataLength = 0;
                    if (type == 'all-page') {
                        dataLength = dataView.getFilteredItems().length;
                        for (var i = 0; i < dataLength ; i++) {
                            var enabled = true;
                            if(contrail.checkIfFunction(gridOptions.checkboxSelectable.enableRowCheckbox)){
                                enabled = gridOptions.checkboxSelectable.enableRowCheckbox(dataView.getItemById('id_' + i));
                            }
                            if (enabled) {
                                rows.push(i);
                            }
                        }
                    } else {
                        dataLength = grid.getDataLength();
                        for (var i = 0; i < dataLength ; i++) {
                            if(gridContainer.find('.rowCheckbox[value="' + i + '"]:disabled').length == 0) {
                                rows.push(i);
                            }
                        }
                    }
                    grid.setSelectedRows(rows);
                },

                getSelectedRow: function(){
                    return grid.getDataItem(gridContainer.data('contrailGrid').selectedRow);
                },
                deleteDataByRows: function(rowIndices){
                	var cgrids = [];
                	$.each(rowIndices, function(key, val){
                		var dataItem = grid.getDataItem(val);
                        cgrids.push(dataItem.cgrid);
                	});
                	dataView.deleteDataByIds(cgrids);
                },
                showGridMessage: function(status, customMsg){
                    var gridStatusMsgConfig = gridConfig.body.statusMessages,
                        statusMsg = contrail.checkIfExist(customMsg) ? customMsg : (contrail.checkIfExist(gridStatusMsgConfig[status]) ? gridStatusMsgConfig[status].text : ''),
                        messageHtml;
                	this.removeGridMessage();
                	if(status == 'loading' || status == 'loadingNextPage'){
                		gridContainer.find('.grid-header-icon-loading').show();
                	}
                	if(status != 'loadingNextPage') {
                	    messageHtml = (contrail.checkIfExist(gridStatusMsgConfig[status])) ? '<p class="' + gridStatusMsgConfig[status].type + '"><i class="' + gridStatusMsgConfig[status].iconClasses + '"></i> ' + statusMsg + '</p>' : status;
                	    gridContainer.find('.grid-load-status').html(messageHtml).removeClass('hide');
                	}

                },
                removeGridMessage: function(){
                    gridContainer.find('.grid-load-status').html('').addClass('hide');
                    if(gridOptions.lazyLoading == null || !gridOptions.lazyLoading) {
                        this.removeGridLoading();
                    }
                },
                removeGridLoading: function(){
                    gridContainer.find('.grid-header-icon-loading').hide();
                },

                adjustAllRowHeight: function() {
                    if (!(gridOptions.fixedRowHeight != false && _.isNumber(gridOptions.fixedRowHeight))) {
                        var self = this;
                        clearTimeout(adjustAllRowHeightTimer);
                        adjustAllRowHeightTimer = setTimeout(function () {
                            var visibleRowIds = gridContainer.find('.slick-row-master').map(function () {
                                    return $(this).data('cgrid');
                                }),
                                rowChunkSize = 25, visibleRowChunk = [];

                            while (visibleRowIds.length > 0) {
                                visibleRowChunk = visibleRowIds.splice(0, rowChunkSize);
                                self.adjustRowHeightByChunk(visibleRowChunk);
                            }
                        }, 50);
                    }
                },

                adjustRowHeightByChunk: function(rowChunks) {
                    if (!(gridOptions.fixedRowHeight != false && _.isNumber(gridOptions.fixedRowHeight))) {
                        var self = this;
                        setTimeout(function () {
                            $.each(rowChunks, function (chunkKey, chunkValue) {
                                self.adjustRowHeight(chunkValue);
                            });
                        }, 5);
                    }
                },

                adjustRowHeight: function(rowId) {
                    if (!(gridOptions.fixedRowHeight != false && _.isNumber(gridOptions.fixedRowHeight))) {
                        var maxHeight = 20;
                        gridContainer.find('.slick_row_' + rowId).find('.slick-cell').each(function(){
                            maxHeight = ($(this).height() > maxHeight) ? $(this).height() : maxHeight;
                        });
                        maxHeight = maxHeight + 10;

                        gridContainer.find('.slick_row_' + rowId).height(maxHeight);
                    }
                },
                adjustDetailRowHeight: function(rowId){
                	var slickdetailRow = gridContainer.find('.slick_row_' + rowId).next('.slick-row-detail'),
                    	detailContainerHeight = slickdetailRow.find('.slick-row-detail-container').height();
                	slickdetailRow.height(detailContainerHeight+10);
                	slickdetailRow.find('.slick-cell').height(detailContainerHeight);
                },
                adjustGridAlternateColors: function(){
                	gridContainer.find('.slick-row-master').removeClass('even').removeClass('odd');
    	            gridContainer.find('.slick-row-master:visible:even').addClass('even');
    	            gridContainer.find('.slick-row-master:visible:odd').addClass('odd');
                },
                destroy: function(){
                	stopAutoRefresh();
                   	$.each(eventHandlerMap.dataView, function(key, val){
                       	dataView[key].unsubscribe(val);
                   	});

                   	$.each(eventHandlerMap.grid, function(key, val){
                       	grid[key].unsubscribe(val);
                    });

                	gridContainer.data('contrailGrid')._grid.destroy();
                    gridContainer.data('contrailGrid', null);
                    gridContainer.html('').removeClass('contrail-grid');
                },
                setRemoteAjaxConfig: function(ajaxConfig) {
                    if(contrail.checkIfExist(gridDataSource.remote.ajaxConfig)) {
                        dataView.setRemoteAjaxConfig(ajaxConfig);
                        dvConfig.remote.ajaxConfig = ajaxConfig;
                        gridDataSource.remote.ajaxConfig = ajaxConfig;
                        customGridConfig.body.dataSource.remote.ajaxConfig = ajaxConfig;
                        return true;
                    } else {
                        return false;
                    }
                },
                /*
                 * Refreshes the grid if the grid data is fetched via ajax call
                 */
                refreshGrid: function(){
                    if (contrail.checkIfExist(gridDataSource.remote) && contrail.checkIfExist(gridDataSource.remote.ajaxConfig.url)) {
                        gridContainer.contrailGrid(customGridConfig);
                    } else {
                        this.refreshView();
                    }
                },
                /*
                 * Refreshes the Dataview if the grid data is fetched via ajax call
                 */
                refreshData: function() {
                    if ((contrail.checkIfExist(gridDataSource.remote) && contrail.checkIfExist(gridDataSource.remote.ajaxConfig.url)) || (contrail.checkIfExist(gridDataSource.dataView) && contrail.checkIfFunction(dataView.refreshData))) {
                        dataView.refreshData();
                    }
                    currentSelectedRows = [];
                },
                /*
                 * Refreshes the view of the grid. Grid is rendered and related adjustments are made.
                 */
                refreshView: function(refreshDetailTemplateFlag){
                	var refreshDetailTemplateFlag = (contrail.checkIfExist(refreshDetailTemplateFlag)) ? refreshDetailTemplateFlag : true;
                	grid.render();
                	grid.resizeCanvas();
                	this.adjustAllRowHeight();
                	this.adjustGridAlternateColors();
                	this.refreshDetailView(refreshDetailTemplateFlag);

                    if (gridContainer.find('.rowCheckbox:disabled').length > 0) {
                        gridContainer.find('.headerRowCheckbox').attr('disabled', true)
                    }
                },
                /*
                 * Refreshes the detail view of the grid. Grid is rendered and related adjustments are made.
                 */
                refreshDetailView: function(refreshDetailTemplateFlag){
                	gridContainer.find('.slick-row-detail').each(function(){
                		if(gridContainer.find('.slick_row_' + $(this).data('cgrid')).is(':visible')){
                			gridContainer.find('.slick_row_' + $(this).data('cgrid')).after($(this));
                            if($(this).is(':visible')) {
                                gridContainer.find('.slick_row_' + $(this).data('cgrid')).find('.toggleDetailIcon').addClass('icon-caret-down').removeClass('icon-caret-right');
                            }
                            if(refreshDetailTemplateFlag){
                        		refreshDetailTemplateById($(this).data('cgrid'));
                        	}
                		}
                		else{
                			$(this).remove();
                		}
                    });
                },
                /* 
                 * Starts AutoRefresh
                 */
                startAutoRefresh: function(refreshPeriod){
                	startAutoRefresh(refreshPeriod);
                },
                /*
                 * Stops AutoRefresh
                 */
                stopAutoRefresh: function(){
                	stopAutoRefresh();
                }
            });
        }

        function generateGridHeaderTemplate(headerConfig){
            var template = ' \
                <h4 class="grid-header-text smaller {{this.cssClass}}"> \
            		<i class="grid-header-icon-loading icon-spinner icon-spin"></i> \
                    <i class="grid-header-icon {{this.icon}} {{this.iconCssClass}} hide"></i> {{this.text}} \
                </h4>',
                headerTemplate;

            if(headerConfig.defaultControls.collapseable){
                template += '\
                <div class="widget-toolbar pull-right"> \
                    <a class="widget-toolbar-icon" data-action="collapse"> \
                        <i class="collapse-icon icon-chevron-up"></i> \
                    </a> \
                </div>';
            }

            if(headerConfig.defaultControls.refreshable){
                template += '\
                <div class="widget-toolbar pull-right"> \
                    <a class="widget-toolbar-icon link-refreshable" title="Refresh" data-action="refresh"> \
                        <i class="icon-repeat"></i> \
                    </a> \
                </div>';
            }

            if(headerConfig.defaultControls.searchable){
                template += '\
                <div class="widget-toolbar pull-right"> \
                    <a class="widget-toolbar-icon link-searchbox" data-action="search"> \
                        <i class="icon-search"></i> \
                    </a> \
                    <span class="input-searchbox hide"> \
                        <span class="input-icon"> \
                            <input type="text" placeholder="Search {{this.text}}" class="input-medium input-grid-search"> \
                            <i class="widget-toolbar-icon icon-search"></i> \
                        </span> \
                    </span> \
                </div>';
            }

            if(headerConfig.defaultControls.exportable) {
                template += '\
                    <div class="widget-toolbar pull-right"> \
                        <a class="widget-toolbar-icon" title="Export as CSV" data-action="export"> \
                            <i class="icon-download-alt"></i> \
                        </a> \
                    </div>';
            }

            if(headerConfig.customControls){
                $.each(headerConfig.customControls, function(key,val){
                    template += '<div class="widget-toolbar pull-right">' + val + '</div>';
                });
            }

            headerTemplate = '<div class="grid-header"><div id="' + gridContainer.prop('id') + '-header' + '"class="widget-header grid-widget-header">' + template + '</div></div>';
            gridContainer.append(Handlebars.compile(headerTemplate)(gridConfig.header.title));

            if(headerConfig.advanceControls){
                $.each(headerConfig.advanceControls, function(key, control) {
                    if(control.type == 'link') {
                        addGridHeaderAction(key, control, gridContainer);
                    } else if (control.type == 'dropdown') {
                        addGridHeaderActionDroplist(key, control, gridContainer);
                    } else if (control.type == 'checked-multiselect') {
                        addGridHeaderActionCheckedMultiselect(key, control, gridContainer);
                    }
                });
            }
        };

        function addGridHeaderAction(key, actionConfig, gridContainer) {
            var actionId = gridContainer.prop('id') + '-header-action-' + key;
            var action = $('<div class="widget-toolbar pull-right"><a ' + (contrail.checkIfExist(actionConfig.linkElementId) ? 'id="' + actionConfig.linkElementId + '" ' : '') +
                ' class="widget-toolbar-icon' + (contrail.checkIfExist(actionConfig.disabledLink) ? ' disabled-link' : '') + '" ' +
                'title="' + actionConfig.title + '">' +
                '<i class="' + actionConfig.iconClass + '"></i></a>' +
                '</div>').appendTo('#' + gridContainer.prop('id') + '-header');

            $(action).on('click', function(){
                actionConfig.onClick();
            });
        };

        function addGridHeaderActionDroplist(key, actionConfig, gridContainer) {
            var actions = actionConfig.actions,
                actionId = gridContainer.prop('id') + '-header-action-' + key;
            var actionsTemplate = '<div class="widget-toolbar pull-right"><a ' + (contrail.checkIfExist(actionConfig.linkElementId) ? 'id="' + actionConfig.linkElementId + '" ' : '') +
                'class="dropdown-toggle' + (contrail.checkIfExist(actionConfig.disabledLink) ? ' disabled-link' : '" data-toggle="dropdown') + '">' +
                '<i class="' + actionConfig.iconClass + '"></i></a>' +
                '<ul id="' + actionId + '" class="pull-right dropdown-menu dropdown-caret">' +
                '</ul></div>';

            $(actionsTemplate).appendTo('#' + gridContainer.prop('id') + '-header');
            $.each(actions, function(key, actionItemConfig){
                if (actionItemConfig.divider) {
                    $('<li class="divider"></li>').appendTo('#' + actionId);
                }
                var actionItem;
                if(actionItemConfig.readOnly) {
                    actionItem = $('<li><i style="padding:0px 5px 0px 18px;cursor:default" class="' + actionItemConfig.iconClass + '"></i>\
                                        <span>' + actionItemConfig.title + '</span> \
                                        </li>').appendTo('#' + actionId);
                } else {
                    actionItem = $('<li><a data-original-title="' + actionItemConfig.title + '"> \
                                        <i class="' + actionItemConfig.iconClass + ' margin-right-10"></i>' + actionItemConfig.title + '</a> \
                                        </li>').appendTo('#' + actionId);
                }

                $(actionItem).on('click', function(){
                    actionItemConfig.onClick();
                });
            });
        };

        function addGridHeaderActionCheckedMultiselect(key, actionConfig, gridContainer) {
            var actions = actionConfig.actions,
                actionId = (contrail.checkIfExist(actionConfig.actionId)) ? actionConfig.actionId : gridContainer.prop('id') + '-header-action-' + key;
            var actionsTemplate = '<div id="' + actionId + '" class="widget-toolbar pull-right"> \
		        <span class="input-multiselectbox"> \
		            <span class="input-icon"> \
		            	<i class="widget-toolbar-icon ' + actionConfig.iconClass + (contrail.checkIfExist(actionConfig.disabledLink) ? ' disabled-link' : '') + '"></i> \
		            </span> \
		        </span> \
		    </div>';

            $(actionsTemplate).appendTo('#' + gridContainer.prop('id') + '-header');
            $('#' + actionId).find('.input-icon').contrailCheckedMultiselect(actionConfig.elementConfig);

            if(actionConfig.disabledLink) {
                $('#' + actionId).find('.input-icon').data('contrailCheckedMultiselect').disable();
            }

//            if($('#' + actionId).find('.input-icon').data('contrailCheckedMultiselect').getChecked().length > 0){
//            	gridContainer.find('.input-multiselectbox').show();
//   	        	gridContainer.find('.link-multiselectbox').hide();
//   	        }
        };

        function addGridRowActionDroplist(actionConfig, gridContainer, rowIndex,targetElement) {
            var menuClass = 'dropdown-menu pull-right dropdown-caret grid-action-menu';
            if (gridOptions.actionCellPosition == 'start') {
                menuClass = 'dropdown-menu pull-left dropdown-caret grid-action-menu';
            }
            var gridActionId = $('<ul id="' + gridContainer.prop('id') + '-action-menu-' + rowIndex + '" class="'+menuClass+'"></ul>').appendTo('body');
            $.each(actionConfig, function(key, actionItemConfig){
                if (actionItemConfig.divider) {
                   $('<li class="divider"></li>').appendTo('#' + gridContainer.prop('id') + '-action-menu-' + rowIndex);
                }

                var actionItem = $('\
                    <li><a class="tooltip-success" data-rel="tooltip" data-placement="left" data-original-title="' + actionItemConfig.title + '"> \
                        <i class="' + actionItemConfig.iconClass + ' margin-right-10"></i>' + actionItemConfig.title + '</a> \
                    </li>').appendTo('#' + gridContainer.prop('id') + '-action-menu-' + rowIndex);

                $(actionItem).on('click', function(){
                    actionItemConfig.onClick(rowIndex,targetElement);
                    gridActionId.remove();
                });
            });
        };

        function emptyGridHandler(){
        	if(!gridOptions.lazyLoading && gridContainer.data('contrailGrid')) {
        		gridContainer.data('contrailGrid').showGridMessage('empty');
        		if(gridOptions.checkboxSelectable != false) {
        			gridContainer.find('.headerRowCheckbox').attr('disabled', true);
        		}
        	}
        };

        function errorGridHandler(errorMsg){
            if(gridContainer.data('contrailGrid') != null) {
                gridContainer.data('contrailGrid').showGridMessage('error','Error: ' + errorMsg);
            }
            if(gridOptions.checkboxSelectable != false) {
                gridContainer.find('.headerRowCheckbox').attr('disabled', true);
            }
        };

        function onDataGridHandler(){
            if(gridOptions.checkboxSelectable != false) {
                var disabled = true;
                gridContainer.find('.rowCheckbox').each(function(){
                   disabled = disabled && (!contrail.checkIfExist($(this).attr('disabled')));
                });

                if(!disabled){
                    gridContainer.find('.headerRowCheckbox').attr('disabled', true);
                } else{
                    gridContainer.find('.headerRowCheckbox').removeAttr('disabled');
                }
            }
        };
    };
}(jQuery));

var SlickGridPager = function (dataView, gridContainer, pagingInfo) {
    var pageSizeSelect = pagingInfo.pageSizeSelect,
    	csgCurrentPageDropDown = null, csgPagerSizesDropdown = null,
        footerContainer = gridContainer.find('.grid-footer'),
        currentPagingInfo = null;

    this.init = function() {
        if(gridContainer.data('contrailGrid') == null) {
            return;
        }
        var eventMap = gridContainer.data('contrailGrid')._eventHandlerMap.dataView;
        eventMap['onPagingInfoChanged'] = function (e, pagingInfo) {
            var currentPageNum = null, currentPageSize = null;

            if (contrail.checkIfExist(currentPagingInfo)) {
                currentPageNum = currentPagingInfo.pageNum;
                currentPageSize = currentPagingInfo.pageSize;
            }

            pagingInfo.pageSizeSelect = pageSizeSelect;
            updatePager(pagingInfo);

            if (pagingInfo.totalPages - pagingInfo.pageNum <= 1 || currentPagingInfo == null || currentPageNum != pagingInfo.pageNum || currentPageSize != pagingInfo.pageSize) {
                if(gridContainer.data('contrailGrid') != null && !gridContainer.data('contrailGrid')._gridStates.allPagesDataChecked) {
                    gridContainer.data('contrailGrid')._grid.setSelectedRows([])
                }

                setTimeout(function(){
                    if(contrail.checkIfExist(gridContainer.data('contrailGrid'))){
                        gridContainer.data('contrailGrid').adjustAllRowHeight();
                        gridContainer.data('contrailGrid').adjustGridAlternateColors();
                    }
                },600);
            }

            currentPagingInfo = pagingInfo;
        };
        dataView.onPagingInfoChanged.subscribe(eventMap['onPagingInfoChanged']);
        constructPagerUI();
        updatePager(pagingInfo);
        setPageSize(pagingInfo.pageSize);
    };

    function populatePagerSelect(data){
        var returnData = new Array();
        $.each(data.pageSizeSelect,function(key,val){
            returnData.push({
                id: val,
                text: String(val) + ' Records'
            });
        });
        return returnData;
    }

    function populateCurrentPageSelect(n){
    	var returnData = new Array();
        for(var i = 0 ; i < n ; i++){
            returnData.push({
                id: i,
                text: 'Page ' + String((i+1))
            });
        }
        return returnData;
    };

    function constructPagerUI() {
    	footerContainer.find('.pager-control-first').click(gotoFirst);
    	footerContainer.find('.pager-control-prev').click(gotoPrev);
    	footerContainer.find('.pager-control-next').click(gotoNext);
    	footerContainer.find('.pager-control-last').click(gotoLast);

        csgCurrentPageDropDown = footerContainer.find('.csg-current-page').contrailDropdown({
            placeholder: 'Select..',
            data: [{id: 0, text: 'Page 1'}],
            change: function(e){
                dataView.setPagingOptions({pageNum: e.val});
                csgCurrentPageDropDown.value(String(e.val));
            },
            formatResult: function(item) {
                return '<span class="grid-footer-dropdown-item">' + item.text + '</span>';
            }
        }).data('contrailDropdown');
        csgCurrentPageDropDown.value('0');

        csgPagerSizesDropdown = footerContainer.find('.csg-pager-sizes').contrailDropdown({
            data: populatePagerSelect(pagingInfo),
            change: function(e){
                dataView.setPagingOptions({pageSize: parseInt(e.val), pageNum: 0});
            },
            formatResult: function(item) {
                return '<span class="grid-footer-dropdown-item">' + item.text + '</span>';
            }
        }).data('contrailDropdown');
        csgPagerSizesDropdown.value(String(pagingInfo.pageSize));

        footerContainer.find(".ui-icon-container").hover(function () {
            $(this).toggleClass("ui-state-hover");
        });
    }

    function updatePager(pagingInfo) {
        var state = getNavState();
        footerContainer.find(".slick-pager-nav i").addClass("icon-disabled");
        if (state.canGotoFirst) {
            footerContainer.find(".icon-step-backward").removeClass("icon-disabled");
        }
        if (state.canGotoLast) {
            footerContainer.find(".icon-step-forward").removeClass("icon-disabled");
        }
        if (state.canGotoNext) {
            footerContainer.find(".icon-forward").removeClass("icon-disabled");
        }
        if (state.canGotoPrev) {
            footerContainer.find(".icon-backward").removeClass("icon-disabled");
        }

        footerContainer.find(".slick-pager-info").text("Total: " + pagingInfo.totalRows + " records");
        footerContainer.find('.csg-total-page-count').text(pagingInfo.totalPages);

        var currentPageSelectData = populateCurrentPageSelect(pagingInfo.totalPages);

        csgCurrentPageDropDown.setData(currentPageSelectData);
        csgCurrentPageDropDown.value('0');
    }

    function getNavState() {
        var pagingInfo = dataView.getPagingInfo();
        var lastPage = pagingInfo.totalPages - 1;

        return {
            canGotoFirst: pagingInfo.pageSize != 0 && pagingInfo.pageNum > 0,
            canGotoLast: pagingInfo.pageSize != 0 && pagingInfo.pageNum < lastPage,
            canGotoPrev: pagingInfo.pageSize != 0 && pagingInfo.pageNum > 0,
            canGotoNext: pagingInfo.pageSize != 0 && pagingInfo.pageNum < lastPage,
            pagingInfo: pagingInfo
        };
    }

    function setPageSize(n) {
        dataView.setRefreshHints({
            isFilterUnchanged: true
        });
        dataView.setPagingOptions({pageSize: n});
    }

    function gotoFirst() {
        if (getNavState().canGotoFirst) {
            dataView.setPagingOptions({pageNum: 0});
            csgCurrentPageDropDown.value('0');
        }
    }

    function gotoLast() {
        var state = getNavState();
        if (state.canGotoLast) {
            dataView.setPagingOptions({pageNum: state.pagingInfo.totalPages - 1});
            csgCurrentPageDropDown.value(String(state.pagingInfo.totalPages - 1));
        }
    }

    function gotoPrev() {
        var state = getNavState();
        if (state.canGotoPrev) {
            dataView.setPagingOptions({pageNum: state.pagingInfo.pageNum - 1});
            csgCurrentPageDropDown.value(String(state.pagingInfo.pageNum - 1));
        }
    }

    function gotoNext() {
        var state = getNavState();
        if (state.canGotoNext) {
            dataView.setPagingOptions({pageNum: state.pagingInfo.pageNum + 1});
            csgCurrentPageDropDown.value(String(state.pagingInfo.pageNum + 1));
        }
    }
};

var ContrailDataView = function(dvConfig) {
    var dataView = new Slick.Data.DataView({ inlineFilters: true }),
        contrailDataView = {}, remoteDataHandler = null;

    $.extend(true, contrailDataView, dataView, {
        _idOffset: 0,
        setData: function (data) {
            // Setting id for each data-item; Required to instantiate data-view.
            setId4Idx(data, this);
            this.beginUpdate();
            this.setItems(data);
            this.endUpdate();
        },
        setSearchFilter: function(searchColumns, searchFilter) {
            this.setFilterArgs({
                searchString: '',
                searchColumns: searchColumns
            });
            this.setFilter(searchFilter);
        },
        addData: function(data){
            var dis = this;
            setId4Idx(data, this);
        	this.beginUpdate();
        	$.each(data, function(key, val){
                dis.addItem(val);
            });
        	this.endUpdate();
        },
        updateData: function(data){
        	this.beginUpdate();
        	var dis = this;
        	$.each(data, function(key,val){
        		dis.updateItem(val.cgrid,val);
            });
        	this.endUpdate();
        },
        deleteDataByIds: function(ids){
        	this.beginUpdate();
        	var dis = this;
        	$.each(ids, function(key,val){
        		dis.deleteItem(val);
            });
        	this.endUpdate();
        },
        setRemoteAjaxConfig: function(ajaxConfig) {
            if(contrail.checkIfExist(dvConfig.remote.ajaxConfig)) {
                remoteDataHandler.setRemoteAjaxConfig(ajaxConfig);
                dvConfig.remote.ajaxConfig = ajaxConfig;
                return true;
            } else {
                return false;
            }
        },
        refreshData: function() {
            if(remoteDataHandler != null) {
                remoteDataHandler.refreshData();
            }
        }
    });

    if(dvConfig != null) {
        if (dvConfig.data != null) {
            contrailDataView.setData(dvConfig.data);
        } else if (dvConfig.remote != null && dvConfig.remote.ajaxConfig != null) {
            remoteDataHandler = new RemoteDataHandler(dvConfig.remote.ajaxConfig, dvConfig.remote.dataParser, dvConfig.remote.initHandler, function (response) {
                dvConfig.remote.successCallback(response);
            }, function (response) {
                dvConfig.remote.refreshSuccessCallback(response);
            }, function (xhr) {
                dvConfig.remote.failureCallback(xhr);
            });
        }
    }

    function setId4Idx(data, dis) {
        var offset = dis._idOffset;
        // Setting id for each data-item; Required to instantiate data-view.
        if (data.length > 0) {
            $.each(data, function (key, val) {
                if(!contrail.checkIfExist(val.cgrid)){
                    data[key].cgrid = 'id_' + (key + offset);
                }
            });
            dis._idOffset += data.length;
        }
    }

    return contrailDataView;
};

var RemoteDataHandler = function(config, dataParser, initCallback, successCallback, refreshSuccessCallback, failureCallback) {

    var initHandler, successHandler, refreshHandler, failureHandler, fetchData,
        requestInProgress = false, ajaxConfig = config, self = this;

    initHandler = function() {
        requestInProgress = true;
        if(contrail.checkIfFunction(initCallback)) {
            initCallback();
        }
    };

    successHandler = function(response) {
        var resultJSON;
        if(contrail.checkIfFunction(dataParser)) {
            resultJSON = dataParser(response);
        } else {
            resultJSON = response;
        }
        if(contrail.checkIfFunction(successCallback)) {
            successCallback(resultJSON);
        }
        requestInProgress = false;
    };

    refreshHandler = function(response) {
        var resultJSON;
        if(contrail.checkIfFunction(dataParser)) {
            resultJSON = dataParser(response);
        } else {
            resultJSON = response;
        }
        if(contrail.checkIfFunction(successCallback)) {
            refreshSuccessCallback(resultJSON);
        }
        requestInProgress = false;
    };

    failureHandler = function(response) {
        if(contrail.checkIfFunction(failureCallback)) {
            failureCallback(response);
        }
        requestInProgress = false;
    };

    fetchData = function() {
        contrail.ajaxHandler(ajaxConfig, initHandler, successHandler, failureHandler);
    };

    self.setRemoteAjaxConfig = function(config) {
        ajaxConfig = config;
    };

    self.refreshData = function() {
        if(!requestInProgress) {
            contrail.ajaxHandler(ajaxConfig, initHandler, refreshHandler, failureHandler);
        }
    };

    fetchData();

    return self;
};

function exportGridData2CSV(gridConfig, gridData) {
    var csvString = '',
        columnNameArray = [],
        columnExportFormatters = [];

    var gridColumns = gridConfig.columnHeader.columns;

    // Populate Header
    $.each(gridColumns, function(key, val){
        if(typeof val.exportConfig === 'undefined' || (typeof val.exportConfig.allow !== 'undefined' && val.exportConfig.allow == true)){
            columnNameArray.push(val.name);
            if(typeof val.exportConfig !== 'undefined' && typeof val.exportConfig.advFormatter === 'function' && val.exportConfig.advFormatter != false){
                columnExportFormatters.push(function(data) { return String(val.exportConfig.advFormatter(data)); });
            } else if((typeof val.formatter !== 'undefined') && (typeof val.exportConfig === 'undefined' || (typeof val.exportConfig.stdFormatter !== 'undefined' && val.exportConfig.stdFormatter != false))){
                columnExportFormatters.push(function(data) { return String(val.formatter(0, 0, 0, 0, data)); });
            } else {
                columnExportFormatters.push(function(data) {
                    var dataValue = String(data[val.field]);
                    if(typeof dataValue === 'object') {
                        return JSON.stringify(dataValue);
                    } else {
                        return dataValue;
                    }
                });
            }
        }
    });
    csvString += columnNameArray.join(',') + '\r\n';

    $.each(gridData, function(key, val){
        var dataLineArray = [];
        $.each(columnExportFormatters, function(keyCol, valCol){
            var dataValue = valCol(val);
            dataValue = dataValue.replace(/"/g, '');
            dataLineArray.push('"' + dataValue + '"');
        });
        csvString += dataLineArray.join(',') + '\r\n';
    });

    var blob = new Blob([csvString], {type:'text/csv'});
    var blobUrl = window.URL.createObjectURL(blob);

    var a = document.createElement('a');
    a.href = blobUrl;
    a.target = '_blank';
    a.download = ((contrail.checkIfExist(gridConfig.header.title.text) && (gridConfig.header.title.text != '' || gridConfig.header.title.text != false)) ? gridConfig.header.title.text.toLowerCase().split(' ').join('-') : 'download') + '.csv';

    document.body.appendChild(a);
    a.click();

    setTimeout(function(){
        a.remove();
        window.URL.revokeObjectURL(blobUrl);
    }, 10000);

};

/*
 * Refresh View of the grid on resize of browser window
 */
$(window).on('resize',function(){
	$('.contrail-grid').each(function(){
		if(contrail.checkIfExist($(this).data('contrailGrid'))){
			$(this).data('contrailGrid').refreshView(false);
		}
	});
});


  }).apply(root, arguments);
});
}(this));

/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */

var DEFAULT_INTERFACE_PCAP_ANALYZER = 'interface-packet-capture';

function startPacketCapture4Interface(interfaceUUID, vnFQN, vmName) {
    var postData = {
        'action': 'start',
        'interfaceUUID': interfaceUUID,
        'vnFQN': vnFQN,
        'direction': 'both',
        'pcapUpdateFunction': 'updatePacketCapture4Interface'
    };
    if (vmName != null && vmName.indexOf(DEFAULT_INTERFACE_PCAP_ANALYZER) != -1) {
        showInfoWindow('Packet capture for default analyzer interface is not available.', 'Message');
        return;
    }
    var closePostData = {'interfaceUUID': interfaceUUID, 'action': 'stop'};
    createPCAPModal('stopPacketCapture4Interface', closePostData, 'Interface Packet Capture');
    doAjaxCall("/api/tenants/config/interface/packet-capture", "POST", JSON.stringify(postData), "getAnalyzerVNCUrl", "startPCAP4InterfaceFailureCB", null, postData);
};

function createPCAPModal(closeClickAction, closePostData, title) {
    var modalLoadingBody = '<i id="pcap-loading" class="icon-spinner icon-spin blue bigger-125 offset4"></i> &nbsp; Starting Packet Capture ...';
    $.contrailBootstrapModal({
        id: 'pcapModal',
        title: title,
        body: modalLoadingBody,
        className: 'modal-1120',
        closeClickAction: closeClickAction,
        closeClickParams: closePostData,
        footer: [
            {
                title: 'Close',
                onclick: closeClickAction,
                className: 'btn-primary',
                onClickParams: closePostData
            }
        ]
    });
    $('#pcapModal').css('z-index', 1051);
}

function getAnalyzerVNCUrl(respose, cbParams) {
    if (respose.message != null) {
        $('#pcapModal').modal('hide');
        showInfoWindow(respose.message, 'Message');
    } else {
        var projectFQN = respose['projectFQN'];
        var projectArray = projectFQN.split(':');
        setCookie('project', projectArray[1]);
        var url = "/api/tenants/config/service-instance-vm?project_id=" + projectArray[1] + "&vm_id=" + respose['vmUUID'];
        doAjaxCall(url, "GET", null, "getAnalyzerVNCUrlSuccessCB", "getAnalyzerVNCUrlFailureCB", false, cbParams);
    }
};

function getFlowAnalyzerVNCUrl(response, cbParams) {
    var firstCBParams = cbParams['firstCBParams'],
        secondCBParams = cbParams['secondCBParams'],
        closePostData;
    if (firstCBParams['defaultPCAPAnalyzerPolicyUUID'] == null) {
        closePostData = cbParams['closePostData'];
        closePostData['defaultPCAPAnalyzerPolicyUUID'] = response['network-policy']['uuid'];
        secondCBParams['defaultPCAPAnalyzerPolicyUUID'] = response['network-policy']['uuid'];
        createPCAPModal('editPacketCapture4Flows', closePostData, 'Flow Packet Capture');
    }
    var projectFQN = firstCBParams['projectFQN'];
    var projectArray = projectFQN.split(':');
    setCookie('project', projectArray[1]);
    var url = "/api/tenants/config/service-instance-vm?project_id=" + projectArray[1] + "&vm_id=" + firstCBParams['vmUUID'];
    doAjaxCall(url, "GET", null, "getAnalyzerVNCUrlSuccessCB", "getAnalyzerVNCUrlFailureCB", false, secondCBParams);
};

function getAnalyzerVNCUrlSuccessCB(result, cbParams) {
    var href = jsonPath(result, "$.console.url")[0];
    var modalBody = '<div class="row-fluid">' +
        '<div class="span10"><p>If console is not responding to keyboard input: click the grey status bar below.&nbsp;&nbsp;<a href="' + href + '" style="text-decoration: underline" target=_blank>Click here to show only console</a></p></div>' +
        '<div id="pcap-direction" class="span2 pull-right"></div>' +
        '<i id="pcap-direction-loading" class="icon-spinner icon-spin blue bigger-150 pull-right hide"></i>' +
        '</div>' +
        '<br>' +
        '<div class="row-fluid">' +
        '<iframe id="vnc-console-frame" src="" class="span12 height-840"></iframe>' +
        '</div>';
    $('#pcapModal .modal-body').html(modalBody);
    $("#vnc-console-frame").attr("src", href);
    var dropdownlist = $("#pcap-direction").contrailDropdown({
        data: [
            {text: 'Ingress & Egress', value: 'both'},
            {text: 'Ingress', value: 'ingress'},
            {text: 'Egress', value: 'egress'}
        ],
        dataTextField: "text",
        dataValueField: "value",
        index: 0,
        change: function (e) {
            var direction = $("#pcap-direction").data("contrailDropdown").value();
            cbParams['direction'] = direction;
            cbParams['action'] = 'update';
            onChangePCAPDirection(cbParams);
        }
    }).data("contrailDropdown");

    dropdownlist.value(cbParams['direction']);
}

function getDirectionText(direction) {
    if(direction == '>' || direction == 'egress') {
        return 'egress';
    } else if(direction == '<' || direction == 'ingress') {
        return 'ingress';
    } else {
        return 'both';
    }
}

function onChangePCAPDirection(postData) {
    $("#pcap-direction-loading").show();
    $('#pcap-direction').data('contrailDropdown').enable(false);
    window[postData['pcapUpdateFunction']](postData);
};

function getAnalyzerVNCUrlFailureCB(error) {
    $('#pcapModal').modal('hide');
}

function startPCAP4InterfaceFailureCB(error) {
    $('#pcapModal').modal('hide');
};

function stopPacketCapture4Interface(postData) {
    $('#pcapModal').modal('hide');
    doAjaxCall("/api/tenants/config/interface/packet-capture", "POST", JSON.stringify(postData));
}

function editPacketCapture4Flows(cbParams) {
    var action = cbParams['action'], params, policyUrl,
        analyzerRuleParams, policyUUID;
    if (action != 'start') {
        params = cbParams;
    } else {
        params = cbParams['secondCBParams'];
    }
    policyUUID = params['defaultPCAPAnalyzerPolicyUUID'];
    policyUrl = '/api/tenants/config/policy/' + policyUUID;
    analyzerRuleParams = params['analyzerRuleParams'];
    $.ajax({
        url: policyUrl,
        dataType: "json",
        success: function (response) {
            var policyRules = response['network-policy']['network_policy_entries']['policy_rule'],
                index, analyzerPolicy = response;
            ;
            if (action == 'start') {
                createPCAPAnalyzerPolicyRule(analyzerPolicy, analyzerRuleParams);
                doAjaxCall(policyUrl, "PUT", JSON.stringify(analyzerPolicy), "getFlowAnalyzerVNCUrl", "createPCAPRuleFailureCB", null, cbParams);
            } else if (action == 'update') {
                index = getPolicyRuleIndex(policyRules, analyzerRuleParams);
                if (index != -1) {
                    policyRules[index]['direction'] = getDirection4Policy(params['direction']);
                    doAjaxCall(policyUrl, "PUT", JSON.stringify(analyzerPolicy), "updatePCAPDirectionSuccessCB", "editPCAP4FlowsFailureCB");
                } else {
                    updatePCAPDirectionSuccessCB();
                }
            } else if (action == 'stop') {
                $('#pcapModal').modal('hide');
                index = getPolicyRuleIndex(policyRules, analyzerRuleParams);
                if (index != -1) {
                    policyRules.splice(index, 1);
                    doAjaxCall(policyUrl, "PUT", JSON.stringify(analyzerPolicy), null, "editPCAP4FlowsFailureCB");
                }
            }
        },
        error: function () {
            $('#pcapModal').modal('hide');
        }
    });
};

function getPolicyRuleIndex(policyRules, analyzerRuleParams) {
    var count = policyRules.length, index = -1;
    for (var i = 0; i < count; i++) {
        if (isMatchedPolicyRule(policyRules[i], analyzerRuleParams)) {
            index = i;
            break;
        }
    }
    return index;
}

function isMatchedPolicyRule(policyRule, analyzerRuleParams) {
    var isMatched = false;
    if (policyRule['protocol'] != analyzerRuleParams.protocol) {
        return isMatched;
    } else if (policyRule['action_list']['mirror_to']['analyzer_name'] != analyzerRuleParams.analyzerNameFQN) {
        return isMatched;
    } else if (policyRule['src_addresses'][0]['virtual_network'] != analyzerRuleParams.srcVN) {
        return isMatched;
    } else if (policyRule['src_ports'][0]['start_port'] != analyzerRuleParams.srcPorts || policyRule['src_ports'][0]['end_port'] != analyzerRuleParams.srcPorts) {
        return isMatched;
    } else if (policyRule['dst_addresses'][0]['virtual_network'] != analyzerRuleParams.destVN) {
        return isMatched;
    } else if (policyRule['dst_ports'][0]['start_port'] != analyzerRuleParams.destPorts || policyRule['dst_ports'][0]['end_port'] != analyzerRuleParams.destPorts) {
        return isMatched;
    } else {
        isMatched = true;
        return isMatched;
    }
}

function updatePacketCapture4Interface(postData) {
    doAjaxCall("/api/tenants/config/interface/packet-capture", "POST", JSON.stringify(postData), 'updatePCAPDirectionSuccessCB', 'updatePCAP4InterfaceFailureCB');
}

function updatePCAPDirectionSuccessCB(params) {
    $("#pcap-direction-loading").hide();
    $('#pcap-direction').data('contrailDropdown').enable(true);
}

function updatePCAP4InterfaceFailureCB(error) {
    $('#pcapModal').modal('hide');
}

function startPacketCapture4Flow(gridId, rowIndex, ruleParamsParser) {
    var dataItem = $('#' + gridId).data('contrailGrid')._grid.getDataItem(rowIndex),
        analyzerRuleParams = window[ruleParamsParser](dataItem),
        postData = {
            action: 'start',
            vnFQN: analyzerRuleParams.srcVN,
            direction: analyzerRuleParams.direction,
            pcapUpdateFunction: 'editPacketCapture4Flows',
            analyzerRuleParams: analyzerRuleParams
        },
        cbParams = {secondCBParams: postData};

    doAjaxCall("/api/tenants/config/flow/packet-capture", "POST", JSON.stringify(postData), "getUUID4PolicyVNCallback", "startPCAP4FlowFailureCB", null, cbParams);
};

function parseAnalyzerRuleParams4Flow(dataItem) {
    var analyzerRuleParams;
    analyzerRuleParams = {
        protocol: getProtocolName(dataItem.protocol).toLowerCase(),
        srcVN: dataItem.src_vn,
        sip: dataItem.sip,
        srcPorts: (dataItem.src_port != '0' && dataItem.src_port != '') ? parseInt(dataItem.src_port) : -1,
        destVN: dataItem.dst_vn,
        dip: dataItem.dip,
        destPorts: (dataItem.dst_port != '0' && dataItem.dst_port != '') ? parseInt(dataItem.dst_port) : -1,
        direction: 'both'
    };
    return analyzerRuleParams;
}

function parseAnalyzerRuleParams4FlowByPort(dataItem) {
    var analyzerRuleParams;
    analyzerRuleParams = {
        protocol: getProtocolName(dataItem.protocol).toLowerCase(),
        srcVN: dataItem.sourcevn,
        sip: dataItem.sourceip,
        srcPorts: (dataItem.sport != '0' && dataItem.sport != '') ? parseInt(dataItem.sport) : -1,
        destVN: dataItem .destvn,
        dip: dataItem.destip,
        destPorts: (dataItem.dport != '0' && dataItem.dport != '') ? parseInt(dataItem.dport) : -1,
        direction: 'both'
    };
    return analyzerRuleParams;
}

function parseAnalyzerRuleParams4FlowRecord(dataItem) {
    var analyzerRuleParams;
    analyzerRuleParams = {
        protocol: getProtocolName(dataItem.protocol).toLowerCase(),
        srcVN: dataItem.sourcevn,
        sip: dataItem.sourceip,
        srcPorts: (dataItem.sport != '0' && dataItem.sport != '') ? parseInt(dataItem.sport) : -1,
        destVN: dataItem.destvn,
        dip: dataItem.destip,
        destPorts: (dataItem.dport != '0' && dataItem.dport != '') ? parseInt(dataItem.dport) : -1,
        direction: dataItem.direction_ing == 0 ? '>' : '<>'

    };
    return analyzerRuleParams;
}

function getUUID4PolicyVNCallback(response, cbParams) {
    var url = "/api/tenants/config/virtual-networks",
        analyzerRuleParams = cbParams['secondCBParams']['analyzerRuleParams'],
        srcVN = analyzerRuleParams.srcVN.split(':'), destVN = analyzerRuleParams.destVN.split(':'),
        srcProject = srcVN[0] + ':' + srcVN[1], destProject = destVN[0] + ':' + destVN[1],
        srcUrl = url + '?tenant_id=' + srcProject, destUrl = url + '?tenant_id=' + destProject,
        isSameProject = (srcProject == destProject) ? true : false,
        srcUUID, destUUID;
    if (response.message == null) {
        cbParams['firstCBParams'] = response;
        $.ajax({
            url: srcUrl,
            dataType: "json",
            success: function (response) {
                srcUUID = fetchUUID4VN(response, srcVN.join(':'));
                if (srcUUID == null) {
                    $('#pcapModal').modal('hide');
                    showInfoWindow('UUID of virtual network not found.', 'Error');
                } else if (isSameProject) {
                    destUUID = fetchUUID4VN(response, destVN.join(':'));
                    if (destUUID == null) {
                        $('#pcapModal').modal('hide');
                        showInfoWindow('UUID of virtual network not found.', 'Error');
                    } else {
                        analyzerRuleParams['srcVNUUID'] = srcUUID;
                        analyzerRuleParams['destVNUUID'] = destUUID;
                        startPCAP4FlowSuccessCB(cbParams);
                    }
                } else {
                    $.ajax({
                        url: destUrl,
                        dataType: "json",
                        success: function (response) {
                            destUUID = fetchUUID4VN(response, destVN.join(':'));
                            if (destUUID == null) {
                                $('#pcapModal').modal('hide');
                                showInfoWindow('UUID of virtual network not found.', 'Error');
                            } else {
                                analyzerRuleParams['srcVNUUID'] = srcUUID;
                                analyzerRuleParams['destVNUUID'] = destUUID;
                                startPCAP4FlowSuccessCB(cbParams);
                            }
                        },
                        error: function () {
                            $('#pcapModal').modal('hide');
                            showInfoWindow('Error in getting UUID of virtual network.', 'Error');
                        }
                    });
                }
            },
            error: function () {
                $('#pcapModal').modal('hide');
                showInfoWindow('Error in getting UUID of virtual network.', 'Error');
            }
        });
    } else {
        $('#pcapModal').modal('hide');
        showInfoWindow(response.message, 'Message');
    }
}

function startPCAP4FlowSuccessCB(cbParams) {
    var analyzerPolicy, analyzerRuleParams = cbParams['secondCBParams']['analyzerRuleParams'],
        closePostData = {'action': 'stop', 'analyzerRuleParams': analyzerRuleParams},
        secondCBParams = cbParams['secondCBParams'],
        firstCBParams = cbParams['firstCBParams'];
    cbParams['closePostData'] = closePostData;
    analyzerRuleParams['domain'] = firstCBParams['domain'];
    analyzerRuleParams['project'] = firstCBParams['project'];
    analyzerRuleParams['analyzerNameFQN'] = firstCBParams['defaultPCAPAnalyzerFQN'];
    analyzerRuleParams['analyzerName'] = firstCBParams['defaultPCAPAnalyzer'];
    if (firstCBParams['defaultPCAPAnalyzerPolicyUUID'] == null) {
        analyzerPolicy = getNewPCAPAnalyzerPolicy(analyzerRuleParams);
        doAjaxCall("/api/tenants/config/policys", "POST", JSON.stringify(analyzerPolicy), "getFlowAnalyzerVNCUrl", "createPCAPRuleFailureCB", null, cbParams);
    } else {
        closePostData['defaultPCAPAnalyzerPolicyUUID'] = firstCBParams['defaultPCAPAnalyzerPolicyUUID'];
        secondCBParams['defaultPCAPAnalyzerPolicyUUID'] = firstCBParams['defaultPCAPAnalyzerPolicyUUID'];
        createPCAPModal('editPacketCapture4Flows', closePostData, 'Flow Packet Capture');
        cbParams['action'] = 'start';
        editPacketCapture4Flows(cbParams);
    }
};

function fetchUUID4VN(vnJSON, vn) {
    var vnList = vnJSON['virtual-networks'],
        count = vnList.length, vnName, uuid = null;
    for (var i = 0; i < count; i++) {
        vnName = vnList[i]['fq_name'].join(':');
        if (vnName == vn) {
            uuid = vnList[i]['uuid'];
            break;
        }
    }
    return uuid;
};

function startPCAP4FlowFailureCB() {
    $('#pcapModal').modal('hide');
};

function editPCAP4FlowsFailureCB(error) {
    $('#pcapModal').modal('hide');
    console.log('Error: ' + JSON.stringify(error));
    showInfoWindow('Error in editing configuration of packet-capture for flow.', 'Error');
};

function createPCAPRuleFailureCB() {
    $('#pcapModal').modal('hide');
};

function getNewPCAPAnalyzerPolicy(analyzerPolicyParams) {
    var domain = analyzerPolicyParams.domain, project = analyzerPolicyParams.project,
        srcVN = analyzerPolicyParams.srcVN, destVN = analyzerPolicyParams.destVN,
        srcPort = analyzerPolicyParams.srcPorts, destPort = analyzerPolicyParams.destPorts,
        srcVNUUID = analyzerPolicyParams.srcVNUUID, destVNUUID = analyzerPolicyParams.destVNUUID,
        protocol = getProtocolName(analyzerPolicyParams.protocol),
        direction = analyzerPolicyParams.direction, vnBackrefs, srcPorts, destPorts;

    srcPorts = (srcPort != 0) ? (srcPort + '-' + srcPort) : 'any';
    destPorts = (destPort != 0) ? (destPort + '-' + destPort) : 'any';

    var mirrorTo = analyzerPolicyParams.analyzerNameFQN;

    var analyzerPolicy = {}, rule = {};

    analyzerPolicy["network-policy"] = {};
    analyzerPolicy["network-policy"]["parent_type"] = "project";
    analyzerPolicy["network-policy"]["fq_name"] = [];
    analyzerPolicy["network-policy"]["fq_name"][0] = domain;
    analyzerPolicy["network-policy"]["fq_name"][1] = project;
    analyzerPolicy["network-policy"]["fq_name"][2] = getDefaultAnalyzerPolicyName(analyzerPolicyParams.analyzerName);

    analyzerPolicy["network-policy"]["virtual_network_back_refs"] = [];
    vnBackrefs = analyzerPolicy["network-policy"]["virtual_network_back_refs"];
    createPolicyVNBackrefs(vnBackrefs, srcVNUUID, srcVN);
    createPolicyVNBackrefs(vnBackrefs, destVNUUID, destVN);

    analyzerPolicy["network-policy"]["network_policy_entries"] = {};
    analyzerPolicy["network-policy"]["network_policy_entries"]["policy_rule"] = [];
    analyzerPolicy["network-policy"]["network_policy_entries"]["policy_rule"][0] = rule;

    if (direction != "<>" && direction != ">") {
        direction = "<>";
    }

    rule["application"] = [];
    rule["rule_sequence"] = {};
    rule["rule_sequence"]["major"] = -1;
    rule["rule_sequence"]["minor"] = -1;
    rule["direction"] = direction;
    rule["protocol"] = protocol.toLowerCase();
    rule["action_list"] = {};
    rule["action_list"]["simple_action"] = null;
    rule["action_list"]["gateway_name"] = null;
    rule["action_list"]["service_chain_type"] = null;

    rule["action_list"]["mirror_to"] = {};
    rule["action_list"]["mirror_to"]["analyzer_name"] = mirrorTo;

    populateAddressesInRule("src", rule, srcVN);
    populateAddressesInRule("dst", rule, destVN);
    populatePortsInRule("src", rule, srcPorts);
    populatePortsInRule("dst", rule, destPorts);

    return analyzerPolicy;
};

function createPCAPAnalyzerPolicyRule(analyzerPolicy, analyzerPolicyParams) {
    var srcVN = analyzerPolicyParams.srcVN, destVN = analyzerPolicyParams.destVN,
        srcPort = analyzerPolicyParams.srcPorts, destPort = analyzerPolicyParams.destPorts,
        srcVNUUID = analyzerPolicyParams.srcVNUUID, destVNUUID = analyzerPolicyParams.destVNUUID,
        protocol = getProtocolName(analyzerPolicyParams.protocol),
        mirrorTo = analyzerPolicyParams.analyzerNameFQN,
        direction = analyzerPolicyParams.direction, vnBackrefs, srcPorts, destPorts, policyRules, newRule = {};

    srcPorts = (srcPort != 0) ? (srcPort + '-' + srcPort) : 'any';
    destPorts = (destPort != 0) ? (destPort + '-' + destPort) : 'any';

    vnBackrefs = analyzerPolicy["network-policy"]["virtual_network_back_refs"];

    createPolicyVNBackrefs(vnBackrefs, srcVNUUID, srcVN);
    createPolicyVNBackrefs(vnBackrefs, destVNUUID, destVN);

    policyRules = analyzerPolicy["network-policy"]["network_policy_entries"]["policy_rule"];
    analyzerPolicy["network-policy"]["network_policy_entries"]["policy_rule"][policyRules.length] = newRule;

    if (direction != "<>" && direction != ">") {
        direction = "<>";
    }

    newRule["application"] = [];
    newRule["rule_sequence"] = {};
    newRule["rule_sequence"]["major"] = -1;
    newRule["rule_sequence"]["minor"] = -1;
    newRule["direction"] = direction;
    newRule["protocol"] = protocol.toLowerCase();
    newRule["action_list"] = {};
    newRule["action_list"]["simple_action"] = null;
    newRule["action_list"]["gateway_name"] = null;
    newRule["action_list"]["service_chain_type"] = null;

    newRule["action_list"]["mirror_to"] = {};
    newRule["action_list"]["mirror_to"]["analyzer_name"] = mirrorTo;

    populateAddressesInRule("src", newRule, srcVN);
    populateAddressesInRule("dst", newRule, destVN);
    populatePortsInRule("src", newRule, srcPorts);
    populatePortsInRule("dst", newRule, destPorts);
};

function createPolicyVNBackrefs(vnBackrefs, vnUUID, vnFQN) {
    var counter = vnBackrefs.length, isPresent = false;
    for (var i = 0; i < counter; i++) {
        if (vnBackrefs[i]["attr"]["timer"] != null && vnBackrefs[i]["uuid"] == vnUUID) {
            isPresent = true;
            break;
        }
    }
    if (!isPresent) {
        vnBackrefs[counter] = {};
        vnBackrefs[counter]["attr"] = {};
        vnBackrefs[counter]["attr"]["timer"] = {"start_time": ""};
        vnBackrefs[counter]["attr"]["sequence"] = null;
        vnBackrefs[counter]["uuid"] = vnUUID;
        vnBackrefs[counter]["to"] = vnFQN.split(':');
    }
};

function getDefaultAnalyzerPolicyName(analyzerName) {
    var policyName = null;
    if (analyzerName) {
        analyzerName = analyzerName.trim().replace(' ', '-');
        policyName = 'default-analyzer-' + analyzerName + '-policy';
    }
    return policyName;
};

function populateAddressesInRule(type, rule, vn) {
    var addressType = type + "_addresses";
    rule[addressType] = [];
    rule[addressType][0] = {};
    rule[addressType][0]["security_group"] = null;
    rule[addressType][0]["subnet"] = null;
    if (vn && vn !== "") {
        if ("any" === vn.toLowerCase()) {
            rule[addressType][0]["virtual_network"] = "any";
        } else {
            rule[addressType][0]["virtual_network"] = vn;
        }
    }
};

function getDirection4Policy(direction) {
    if (direction == 'egress') {
        return '>';
    } else {
        return '<>';
    }
}

function populatePortsInRule(type, rule, ports) {
    var portType = type + "_ports",
        startPortsArray = [], endPortsArray = [];
    var startPorts = getStartPort(ports);
    if (startPorts != -1) {
        startPortsArray = startPorts.split(",");
    }

    var endPorts = getEndPort(ports);
    if (endPorts != -1) {
        endPortsArray = endPorts.split(",");
    }

    if (startPortsArray != -1 && endPortsArray != -1 && startPortsArray.length > 0 && endPortsArray.length > 0) {
        rule[portType] = [];
        if (checkValidPortRange(startPortsArray, endPortsArray, type == 'src' ? true : false) === true) {
            for (var j = 0; j < startPortsArray.length; j++) {
                rule[portType][j] = {};
                rule[portType][j]["start_port"] = parseInt(startPortsArray[j]);
                rule[portType][j]["end_port"] = parseInt(endPortsArray[j]);
            }
        }
    } else {
        rule[portType] = [
            {}
        ];
        rule[portType][0]["start_port"] = -1;
        rule[portType][0]["end_port"] = -1;
    }
};

function showUnderlayPaths(data) {
    var currentUrlHashObj = layoutHandler.getURLHashObj(),
        currentPage = currentUrlHashObj.p,
        currentParams = currentUrlHashObj.q;
        var params = {};
        params.srcIP = data.sourceip;
        params.destIP = data.destip;
        params.srcVN = data.sourcevn;
        params.destVN = data.destvn;
        params.sport = data.sport;
        params.dport = data.dport;
        params.protocol = data.protocol;
        if(data.direction_ing === 0) {
            params.direction = 'egress';
            params.nodeIP = data.other_vrouter_ip;
        } else {
            params.direction = 'ingress';
            params.nodeIP = data.vrouter_ip;
        }
        if(currentPage == 'mon_infra_underlay' && typeof underlayRenderer === 'object' && !underlayRenderer.getModel().checkIPInVrouterList(params)) {
            showInfoWindow("Cannot Map the path for the selected flow", "Info");
            return;
        }
        if(data.hasOwnProperty('startTime') && data.hasOwnProperty('endTime')) {
            params['startTime'] = data['startTime'];
            params['endTime'] = data['endTime'];
        } else {
            params['minsSince'] = 300;
        }
        if(currentPage == 'mon_infra_underlay') {
            var progressBar = $("#network_topology").find('.topology-visualization-loading');
            $(progressBar).show();
            $(progressBar).css('margin-bottom',$(progressBar).parent().height());
            
        }
        switch(currentPage) {
            case 'mon_infra_underlay':
                $("#network_topology").find('.topology-visualization-loading').show();
                var cfg = {
                    url     : "/api/tenant/networking/underlay-path",
                    type    : "POST",
                    data    : {data: params},
                    callback : function(response) {
                        $("#network_topology").find('.topology-visualization-loading').hide();
                        if(params['startAt'] != null && underlayLastInteracted > params['startAt'])
                            return;
                        if(typeof underlayRenderer === 'object') {
                            underlayRenderer.getModel().setFlowPath(response);
                            if (ifNull(response['nodes'],[]).length == 0 || ifNull(response['links'],[]).length == 0) {
                                showInfoWindow("Cannot Map the path for selected flow", "Info");
                                underlayRenderer.getView().resetTopology(false);
                            } else {
                                underlayRenderer.getView().highlightPath(response, {data: params});
                            }
                            if(ifNull(response['nodes'],[]).length > 0 || ifNull(response['links']).length > 0) {
                                $('html,body').animate({scrollTop:0}, 500);
                            }
                        }
                    },
                    failureCallback: function(err) {
                        if(params['startAt'] != null && underlayLastInteracted > params['startAt'])
                            return;
                        $("#network_topology").find('.topology-visualization-loading').hide();
                        showInfoWindow('Error in fetching details','Error');
                    },
                    completeCallback: function(ajaxObj, state) {
                        if(state != 'success') {
                            $("#network_topology").find('.topology-visualization-loading').hide();
                            if(state == 'timeout') {
                                showInfoWindow('Timeout in fetching details','Error');
                            } else {
                                showInfoWindow('Error in fetching details','Error');
                            }
                            if(null !== underlayRenderer && typeof underlayRenderer === "object"){
                                underlayRenderer.getView().resetTopology(false);
                            }
                        }
                    }
                };
                underlayRenderer.getController().getModelData(cfg);
                break;
            case 'query_flow_records':
                layoutHandler.setURLHashParams(params,{p:'mon_infra_underlay',merge:false});
                break;
        }
}
;
define("analyzer-utils", function(){});

/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */

function infraMonitorClass() {
    var self = this;
    var viewModels=[];
    var dashboardConfig = [];
    var tabs = [];
    //Show down node count only if it's > 0
    function showHideDownNodeCnt() {
        var downSelectors = $('[data-bind="text:downCnt"]');
        $.each(downSelectors,function(idx,elem) {
            if($(elem).text() == "0")
                $(elem).hide();
            else
                $(elem).show();
        });
    }

    /*Selenium Testing*/
    this.getDashboardDataObj = function(){
        return dashboardViewModel;
    }
    /*End of Selenium Testing*/

    this.destroy = function () {
        //Cancel the pending ajax calls
        var kGrid = $('.contrail-grid').data('contrailGrid');
        if(kGrid != null)
            kGrid.destroy();
    }

    this.updateViewByHash = function (hashObj, lastHashObj) {
        self.load({hashParams:hashObj});
    }

    this.updateInfoBoxes = function() {
         var infoListTemplate = contrail.getTemplate4Id("infoList-template"),dashboardDataArr = [];;
         $.each(viewModels,function(idx,currViewModel) {
             dashboardDataArr = dashboardDataArr.concat(currViewModel.data());
         });
         var dashboardCF = crossfilter(dashboardDataArr);
         var nameDimension = dashboardCF.dimension(function(d) { return d.name });
         var verDimension = dashboardCF.dimension(function(d) { return d.version });
         var verGroup = verDimension.group();
         var verArr = [];
         var systemCnt = 0;
         var systemList = [];
         for(var i=0;i<dashboardDataArr.length;i++) {
            if(dashboardDataArr[i]['vRouterType'] == null || dashboardDataArr[i]['vRouterType'] != 'tor-agent')
                systemList.push(dashboardDataArr[i]['name']);
         }
         systemCnt = systemList.unique().length;
         var infoData = [{lbl:'No. of servers',value:systemCnt}];
         infoData.push({lbl:'No. of logical nodes', value:dashboardDataArr.length});
         //Distinct Versions
         if(verGroup.all().length > 1) {
             //verArr = verGroup.order(function(d) { return d.value;}).top(2);
             verArr = verGroup.top(Infinity);
             var unknownVerInfo = [];
             $.each(verArr,function(idx,value) {
                 if(verArr[idx]['key'] == '' || verArr[idx]['key'] ==  '-')
                    unknownVerInfo.push({lbl:'Logical nodes with version unknown',value:verArr[idx]['value']}) ;
                 else
                     infoData.push({lbl:'Logical nodes with version ' + verArr[idx]['key'],value:verArr[idx]['value']});
             });
             if(unknownVerInfo.length > 0)
                 infoData = infoData.concat(unknownVerInfo);
         } else if(verGroup.all().length == 1)
             infoData.push({lbl:'version',value:verGroup.all()[0]['key']});
         $('#system-info-stat').html(infoListTemplate(infoData));
         endWidgetLoading('sysinfo');
    }

    this.updateAlerts = function(){
        var alertTemplate=contrail.getTemplate4Id("alerts-template");
        var alerts_nodes=[];
        var nodeAlerts=self.getNodeAlerts(viewModels);
        var processAlerts = self.getAllProcessAlerts(viewModels);
        var allAlerts = nodeAlerts.concat(processAlerts);
        allAlerts.sort(dashboardUtils.sortInfraAlerts);
        if(globalAlerts.length > 0)
            allAlerts = allAlerts.concat($.extend(true,[],globalAlerts));
        //Filtering the alerts for alerts popup based on the detailAlert flag
        var popupAlerts = [];
        for(var i=0;i<allAlerts.length;i++) {
           if(allAlerts[i]['detailAlert'] != false)
               popupAlerts.push(allAlerts[i]);
        }
        var alertDS = globalObj['dataSources']['alertsDS'];
        var alertsDeferredObj = alertDS['deferredObj'];
        if(popupAlerts.length > 0)
            alertDS['dataSource'].setData(popupAlerts);
        if(globalObj.showAlertsPopup){
            loadAlertsContent(alertsDeferredObj);
        }
        /*Need to resolve the alertsDef once all the alertsDS depend datasource are loaded
         */
        var allDSResolved = true;
        if(alertDS['depends'] instanceof Array) {
            for(var i = 0; i < alertDS['depends'].length; i++){
                 var dataSource = globalObj['dataSources'][alertDS['depends'][i]];
                 if(manageDataSource.isLoading(dataSource))
                     allDSResolved = false
            }
        }
        if(allDSResolved && alertsDeferredObj != null)
            alertsDeferredObj.resolve();
        var detailAlerts = [];
        for(var i = 0; i < allAlerts.length; i++ ){
            if(allAlerts[i]['detailAlert'] != false)
                detailAlerts.push(allAlerts[i]);
        }
        //Display only 5 alerts in "Dashboard"
        $('#alerts-box-content').html(alertTemplate(detailAlerts.slice(0,5)));
        endWidgetLoading('alerts');
        $("#moreAlertsLink").click(function(){
            loadAlertsContent();
        });
    }

    this.addInfoBox = function(infoBoxObj) {
        //If dashboard is not already loaded,load it
        if($('.infobox-container').length == 0)
            this.load();
        dashboardConfig.push(infoBoxObj);
        viewModels.push(infoBoxObj['viewModel']);
        var infoBoxTemplate  = contrail.getTemplate4Id('infobox-template');
        var obj = infoBoxObj;
        $('#topStats').append(infoBoxTemplate({title:obj['title'],totalCntField:'totalCnt',
            activeCntField:'upCnt',inactiveCntField:'downCnt'}));
        var tabContentTemplate = contrail.getTemplate4Id(obj['template']);
        $('#dashboard-charts').append($('<div>').addClass('dashboard-chart-item').addClass('row-fluid').addClass('hide').html(tabContentTemplate));
        ko.applyBindings(obj['viewModel'],$('#topStats').children(':last')[0]);
        //Issue calls to fetch data
        var nodeDS = new SingleDataSource(obj['dataSourceObj']);
        var result = nodeDS.getDataSourceObj();
        var dataSource = result['dataSource'];
        var deferredObj = result['deferredObj'];
      //if cached data is available trigger event to update
        if(result['lastUpdated'] != null && (result['error'] == null || result['error']['errTxt'] == 'abort')){
            triggerDatasourceEvents(nodeDS);
        }
        infoBoxObj['viewModel'].downCnt.subscribe(function(newValue) {
            showHideDownNodeCnt();
        });
        //Update the viewModel
        $(nodeDS).on('change',function() {
            var data = dataSource.getItems();
            obj['viewModel'].data(data);
            self.updateInfoBoxes();
            self.updateAlerts();
        });

    }

    function loadLogs() {
        function getLogs(deferredObj) {
            var retArr = [];
            $.ajax({
                url: monitorInfraUrls['QUERY'] + '?where=&filters=&level=4&fromTimeUTC=now-10m' +
                    '&toTimeUTC=now&table=MessageTable&limit=10'
            }).done(function(result) {
                retArr = $.map(result['data'],function(obj,idx) {
                    obj['message'] = qewu.formatXML2JSON(obj['Xmlmessage']);
                    obj['timeStr'] = diffDates(new XDate(obj['MessageTS']/1000),new XDate());
                    if(obj['Source'] == null)
                        obj['moduleId'] = contrail.format('{0}',obj['ModuleId']);
                    else
                        obj['moduleId'] = contrail.format('{0} ({1})',obj['ModuleId'],obj['Source']);
                    if($.inArray(obj['ModuleId'],[UVEModuleIds['DISCOVERY_SERVICE'],UVEModuleIds['SERVICE_MONITOR'],UVEModuleIds['SCHEMA'],UVEModuleIds['CONFIG_NODE']]) != -1)
                        obj['link'] = {p:'mon_infra_config',q:{node:obj['Source'],tab:''}};
                    else if($.inArray(obj['ModuleId'],[UVEModuleIds['COLLECTOR'],UVEModuleIds['OPSERVER'],UVEModuleIds['QUERYENGINE']],obj['ModuleId']) != -1)
                        obj['link'] = {p:'mon_infra_analytics',q:{node:obj['Source'],tab:''}};
                    else if($.inArray(obj['ModuleId'],[UVEModuleIds['VROUTER_AGENT']]) != -1)
                        obj['link'] = {p:'mon_infra_vrouter',q:{node:obj['Source'],tab:''}};
                    else if($.inArray(obj['ModuleId'],[UVEModuleIds['CONTROLNODE']]) != -1)
                        obj['link'] = {p:'mon_infra_control',q:{node:obj['Source'],tab:''}};
                    return obj;
                });
                deferredObj.resolve(retArr);
            }).fail(function(result) {
                deferredObj.resolve(retArr);
            });
        }
        var logListTemplate = contrail.getTemplate4Id("logList-template");
        var logDeferredObj = $.Deferred();
        getLogs(logDeferredObj);
        logDeferredObj.done(function(data) {
            //Display only recent 3 log messages
        	$('#logs-box .widget-main').empty().html(logListTemplate(data.reverse().slice(0,3)));
            endWidgetLoading('logs');
        });
    }

    function loadInfoBoxes() {

        $('.infobox-container').on('click','.infobox',function() {
            tabs = [];
            $.each(dashboardConfig,function(idx,obj) {
                tabs.push(obj['tabId']);
            });
            var tabIdx = $(this).index();
            layoutHandler.setURLHashParams({tab:tabs[tabIdx]},{triggerHashChange:false});
            //Hide all tab contents
            $('#dashboard-charts .dashboard-chart-item').hide();
            $('.infobox').removeClass('infobox-blue infobox-dark active').addClass('infobox-grey');
            $($('.infobox')[tabIdx]).removeClass('infobox-grey').addClass('infobox-blue infobox-dark active');
            var currTabContainer = $('#dashboard-charts .dashboard-chart-item')[tabIdx];
            //Show the current tab content
            $(currTabContainer).show();
            //Trigger refresh on svg charts
            $(currTabContainer).find('svg').trigger('refresh');
            //Only the window object fires "resize" event
            $(window).resize();
        });

        //When all node details are fetched,upedate alerts & info boxes
        /*
        var deferredObjs = [];
        $.when.apply(window,deferredObjs).done(
            function(vRouterResult,ctrlNodeResult,analyticsResult,configResult) {
                self.updateAlertsAndInfoBoxes();
            });
        */
    }

    //Concatenate Process alerts across all nodes
    this.getAllProcessAlerts = function(data) {
        var alertsList = [];
        $.each(viewModels,function(idx,currViewModel) {
            $.each(currViewModel.data(),function(i,obj) {
                alertsList = alertsList.concat(obj['processAlerts']);
            });
        });
        return $.extend(true,[],alertsList);
    }

    //Construct Node-specific Alerts looping through all nodes
    this.getNodeAlerts = function(data) {
        var alertsList = [];
        $.each(viewModels,function(idx,currViewModel) {
            $.each(currViewModel.data(),function(i,obj) {
                alertsList = alertsList.concat(obj['nodeAlerts']);
            });
        });
        return $.extend(true,[],alertsList);
    }

    this.load = function (obj) {
        var infraDashboardTemplate = contrail.getTemplate4Id('infra-dashboard');
        $(contentContainer).html('');
        $(contentContainer).html(infraDashboardTemplate);
        viewModels=[];

        loadInfoBoxes();
        loadLogs();
        //Setting the alertsDS in global datasource object
        //depends attribute conveys the datasource dependcies
        globalObj['dataSources']['alertsDS'] = {
                                                    dataSource:new ContrailDataView(),
                                                    depends:['controlNodeDS','computeNodeDS','analyticsNodeDS','configNodeDS'],
                                                    deferredObj: $.Deferred()
                                               }
        //Initialize the common stuff
        $($('#dashboard-stats .widget-header')[0]).initWidgetHeader({title:'Logs',widgetBoxId :'logs'});
        $($('#dashboard-stats .widget-header')[1]).initWidgetHeader({title:'System Information', widgetBoxId: 'sysinfo'});
        $($('#dashboard-stats .widget-header')[2]).initWidgetHeader({title:'Alerts', widgetBoxId: 'alerts' });

    }
    this.selectTabByHash = function() {
        var hashParams = layoutHandler.getURLHashParams();
        //Select node tab based on URL hash parameter
        var tabIdx = $.inArray(ifNull(hashParams['tab']),tabs);
        if(tabIdx <= -1)
            tabIdx = 0;
        $($('.infobox-container .infobox')[tabIdx]).trigger('click');
    }
}

var infraDashboardView = new infraMonitorClass();

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
define("dashboard-utils", function(){});

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
                if (typeof contentHandler === 'undefined') {
                    contentHandler = new ContentHandler();
                }

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
            if(contentHandler.isInitFeatureAppComplete) {
                contentHandler.loadContent(lastHash, currHash, loadingStartedDefObj);
            } else if (contentHandler.isInitFeatureAppInProgress) {
                contentHandler.featureAppDefObj.done(function () {
                    contentHandler.loadContent(lastHash, currHash, loadingStartedDefObj);
                });
            } else {
                contentHandler.loadFeatureApps(globalObj['webServerInfo']['featurePkg']);
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
//# sourceMappingURL=backbone-min.map;
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

define('js/contrail-libs',[
    'core-utils',
    'core-constants',
    'core-formatters',
    'core-cache',
    'core-labels',
    'core-messages',
    'core-views-default-config',
    'chart-utils',
    'core.app.utils',

    'handlebars-utils',          
    'contrail-elements',         

    'protocol',                  
    'uuid',                      
    'contrail-common',           

    'slickgrid-utils',          
    // 'contrail-load',
    // 'web-utils',                 
    // 'config_global',             
    // 'contrail-layout',
    'analyzer-utils',            
    'dashboard-utils',           

    'contrail-remote-data-handler',
    'layout-handler',
    'menu-handler',
    'content-handler',
    'cf-datasource',

    'contrail-view',
    'contrail-model',
    'contrail-view-model',
    'contrail-list-model',
        ], function() {
            
            });





