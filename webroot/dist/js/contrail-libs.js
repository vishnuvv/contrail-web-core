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
            //Waiting for all feature pkgs to load??
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

    // 'slickgrid-utils',          
    // 'contrail-load',
    // 'web-utils',                 
    // 'config_global',             
    // 'contrail-layout',
    // 'analyzer-utils',            
    // 'dashboard-utils',           

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





