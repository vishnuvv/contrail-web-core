/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */

define('core-basedir/js/views/GridFooterView',[
    'underscore'
], function (_) {
    var GridFooterView = function (dataView, gridContainer, pagingInfo) {
        var pageSizeSelect = pagingInfo.pageSizeSelect,
            csgCurrentPageDropDown = null, csgPagerSizesDropdown = null,
            footerContainer = gridContainer.find('.grid-footer'),
            currentPagingInfo = null;

        this.init = function () {
            if (gridContainer.data('contrailGrid') == null) {
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
                    if (gridContainer.data('contrailGrid') != null && !gridContainer.data('contrailGrid')._gridStates.allPagesDataChecked) {
                        gridContainer.data('contrailGrid')._grid.setSelectedRows([])
                    }

                    setTimeout(function () {
                        if (contrail.checkIfExist(gridContainer.data('contrailGrid'))) {
                            gridContainer.data('contrailGrid').adjustAllRowHeight();
                            gridContainer.data('contrailGrid').adjustGridAlternateColors();
                        }
                    }, 600);
                }

                currentPagingInfo = pagingInfo;
            };
            dataView.onPagingInfoChanged.subscribe(eventMap['onPagingInfoChanged']);
            constructPagerUI();
            updatePager(pagingInfo);
            setPageSize(pagingInfo.pageSize);
        };

        function populatePagerSelect(data) {
            var returnData = new Array();
            $.each(data.pageSizeSelect, function (key, val) {
                returnData.push({
                    id: val,
                    text: String(val) + ' Records'
                });
            });
            return returnData;
        }

        function populateCurrentPageSelect(n) {
            var returnData = new Array();
            for (var i = 0; i < n; i++) {
                returnData.push({
                    id: i,
                    text: 'Page ' + String((i + 1))
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
                change: function (e) {
                    dataView.setPagingOptions({pageNum: e.val});
                    csgCurrentPageDropDown.value(String(e.val));
                },
                formatResult: function (item) {
                    return '<span class="grid-footer-dropdown-item">' + item.text + '</span>';
                }
            }).data('contrailDropdown');
            csgCurrentPageDropDown.value('0');

            csgPagerSizesDropdown = footerContainer.find('.csg-pager-sizes').contrailDropdown({
                data: populatePagerSelect(pagingInfo),
                change: function (e) {
                    dataView.setPagingOptions({pageSize: parseInt(e.val), pageNum: 0});
                },
                formatResult: function (item) {
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

    return GridFooterView;
});
/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */

define('core-basedir/js/views/GridView',[
    'underscore',
    'contrail-view',
    'contrail-list-model',
    'core-basedir/js/views/GridFooterView',
    'slick.checkboxselectcolumn',
    'slick.grid','slick.rowselectionmodel',
    'jquery-ui',
    'jquery.multiselect',
    'jquery.multiselect.filter'
], function (_, ContrailView, ContrailListModel, GridFooterView) {
    var GridView = ContrailView.extend({
        render: function () {
            var self = this,
                viewConfig = self.attributes.viewConfig,
                listModelConfig = $.extend(true, {}, viewConfig.elementConfig['body']['dataSource']),
                modelMap = contrail.handleIfNull(self.modelMap, {}),
                contrailListModel, gridConfig, gridContainer,
                customGridConfig;

            var grid = null, dataView = null, footerPager = null,
                gridDataSource, gridColumns, gridSortColumns = [], gridOptions,
                autoRefreshInterval = false, searchColumns = [],
                currentSelectedRows = [],
                dvConfig = null, eventHandlerMap = {grid: {}, dataView: {}},
                scrolledStatus = {scrollLeft: 0, scrollTop: 0},
                adjustAllRowHeightTimer = null;

            if (contrail.checkIfExist(viewConfig.modelKey) && contrail.checkIfExist(modelMap[viewConfig.modelKey])) {
                self.model = modelMap[viewConfig.modelKey]
            }

            contrailListModel = (self.model != null) ? self.model : new ContrailListModel(listModelConfig);

            //delete viewConfig.elementConfig['body']['dataSource']['remote'];
            //viewConfig.elementConfig['body']['dataSource'] = {dataView: contrailListModel};
            viewConfig.elementConfig['body']['dataSource']['dataView'] = contrailListModel;


            gridConfig = $.extend(true, {}, covdc.gridConfig, viewConfig.elementConfig);
            gridContainer = $(this.$el);
            // gridContainer = $(contentContainer);
            customGridConfig = $.extend(true, {}, gridConfig);

            if (contrail.checkIfExist(gridContainer.data('contrailGrid'))) {
                gridContainer.data('contrailGrid').destroy();
            }

            gridContainer.addClass('contrail-grid');
            gridDataSource = gridConfig.body.dataSource;
            gridColumns = gridConfig.columnHeader.columns;
            gridOptions = gridConfig.body.options;
            gridConfig.footer = ($.isEmptyObject(gridConfig.footer)) ? false : gridConfig.footer;

            if (contrail.checkIfKeyExistInObject(true, customGridConfig, 'footer.pager.options.pageSizeSelect')) {
                gridConfig.footer.pager.options.pageSizeSelect = customGridConfig.footer.pager.options.pageSizeSelect;
            }

            if (gridOptions.fixedRowHeight != false && _.isNumber(gridOptions.fixedRowHeight)) {
                gridOptions.rowHeight = gridOptions.fixedRowHeight;
            }

            if (contrail.checkIfExist(gridDataSource.dataView)) {
                dataView = gridDataSource.dataView;
                var dataViewData = dataView.getItems();
                //TODO: We should not need to set data with empty array.
                dataView.setData([]);
                initContrailGrid(dataView);
                initDataView(gridConfig);
                dataView.setSearchFilter(searchColumns, searchFilter);
                initClientSidePagination();
                initGridFooter();
                dataView.setData(dataViewData);
            }

            if (contrailListModel.isRequestInProgress()) {
                gridContainer.addClass('grid-state-fetching');
                if (gridOptions.disableRowsOnLoading) {
                    gridContainer.addClass('grid-state-fetching-rows');
                }
            }

            if (contrailListModel.loadedFromCache || !(contrailListModel.isRequestInProgress())) {
                if (contrail.checkIfExist(gridContainer.data('contrailGrid'))) {
                    gridContainer.data('contrailGrid').removeGridLoading();
                    handleGridMessage();
                    performSort(gridSortColumns);
                }
            }

            contrailListModel.onAllRequestsComplete.subscribe(function () {
                if (contrail.checkIfExist(gridContainer.data('contrailGrid'))) {
                    gridContainer.data('contrailGrid').removeGridLoading();
                    handleGridMessage();

                    performSort(gridSortColumns);
                    //TODO: Execute only in refresh case.
                    if (gridConfig.header.defaultControls.refreshable) {
                        setTimeout(function () {
                            gridContainer.find('.link-refreshable i').removeClass('icon-spin icon-spinner').addClass('icon-repeat');
                        }, 1000);
                    }
                }
            });

            function handleGridMessage() {
                if(contrailListModel.error) {
                    if(contrailListModel.errorList.length > 0) {
                        gridContainer.data('contrailGrid').showGridMessage('error', 'Error: ' + contrailListModel.errorList[0].responseText);
                    } else {
                        gridContainer.data('contrailGrid').showGridMessage('error');
                    }
                } else if (gridOptions.defaultDataStatusMessage && contrailListModel.getItems().length == 0) {
                    gridContainer.data('contrailGrid').showGridMessage('empty')
                }
            };

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

            function startAutoRefresh(refreshPeriod) {
                if (refreshPeriod && !autoRefreshInterval) {
                    autoRefreshInterval = setInterval(function () {
                        if (gridContainer.find('.grid-body').is(':visible')) {
                            gridContainer.data('contrailGrid').refreshData();
                        }
                        else {
                            stopAutoRefresh();
                        }
                    }, refreshPeriod * 1000);
                }
            };

            function stopAutoRefresh() {
                if (autoRefreshInterval) {
                    clearInterval(autoRefreshInterval);
                    autoRefreshInterval = false;
                }
            };

            function initContrailGrid(dataObject) {
                var checkboxSelector = new Slick.CheckboxSelectColumn({
                    cssClass: "slick-cell-checkboxsel"
                });
                initGridHeader();
                initGridBodyOptions(checkboxSelector);
                gridContainer.append('<div class="grid-body"></div>');
                if (gridOptions.autoHeight == false) {
                    gridContainer.find('.grid-body').height(gridOptions.gridHeight);
                }
                var visibleColumns = [];
                $.each(gridColumns, function(key, column) {
                    if ((contrail.checkIfExist(column.hide) && !(column.hide)) ||
                        !contrail.checkIfExist(column.hide)) {
                        visibleColumns.push(column);
                    }
                });
                grid = new Slick.Grid(gridContainer.find('.grid-body'), dataObject, visibleColumns, gridOptions);
                grid.setSelectionModel(new Slick.RowSelectionModel({selectActiveRow: false}));
                grid.registerPlugin(checkboxSelector);
                gridContainer.find('.grid-canvas').prepend('<div class="grid-load-status hide"></div>');
                initGridEvents();
                setDataObject4ContrailGrid();
                gridContainer.data('contrailGrid').showGridMessage('loading');
            };

            function initGridHeader() {
                // Grid Header - Title + Other Actions like Expand/Collapse, Search and Custom actions
                if (gridConfig.header) {
                    generateGridHeaderTemplate(gridConfig.header);

                    gridContainer.find('.grid-widget-header .widget-toolbar-icon, .grid-widget-header .grid-header-text').on('click', function (e) {
                        if (!$(this).hasClass('disabled-link')) {
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
                                    if (!contrailListModel.isRequestInProgress()) {
                                        gridContainer.find('.link-refreshable i').removeClass('icon-repeat').addClass('icon-spin icon-spinner');
                                        gridContainer.data('contrailGrid').refreshData();
                                    }
                                    break;
                                case 'export':
                                    if (!contrailListModel.isRequestInProgress()) {
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

                    gridContainer.find('[data-action="widget-collapse"]')
                        .off('click')
                        .on('click', function (event) {
                            gridContainer.data('contrailGrid').expand();
                        });

                    $.each(gridColumns, function (key, val) {
                        // Setting searchable:true for columns wherever necessary
                        if (gridConfig.header.defaultControls.searchable) {
                            if (typeof val.searchable == 'undefined' || val.searchable != false)
                                searchColumns.push(val);
                        }
                        if (!contrail.checkIfExist(val.tooltip)) {
                            val.toolTip = val.name;
                        }
                        if (gridOptions.fixedRowHeight != false && _.isNumber(gridOptions.fixedRowHeight)) {
                            val.cssClass = (contrail.checkIfExist(val.cssClass) ? val.cssClass + ' ' : '') +
                                'fixed-row-height height-' + (gridOptions.fixedRowHeight - 10);
                        }
                    });
                }

                $.each(gridColumns, function (columnKey, columnValue) {
                    // Setting sortable:true for columns wherever necessary
                    if (gridOptions.sortable != false) {
                        if (!contrail.checkIfExist(columnValue.sortable)) {
                            gridColumns[columnKey].sortable = true;
                        }
                        if (contrail.checkIfExist(gridOptions.sortable.defaultSortCols) && contrail.checkIfExist(gridOptions.sortable.defaultSortCols[columnValue.field])) {
                            gridOptions.sortable.defaultSortCols[columnValue.field].sortCol = columnValue;
                        }
                    }
                    else {
                        gridColumns[columnKey].sortable = false;
                    }

                    if ($.isPlainObject(columnValue.formatter)) {
                        columnValue.formatterObj = _.clone(columnValue.formatter)
                        columnValue.formatter = function (r, c, v, cd, dc) {
                            var formatterObj = columnValue.formatterObj,
                                fieldValue = dc[columnValue.field],
                                options = contrail.checkIfExist(formatterObj.options) ? formatterObj.options : {};

                            options.dataObject = dc;

                            if (contrail.checkIfExist(formatterObj.path)) {
                                fieldValue = contrail.getObjectValueByPath(dc, formatterObj.path);
                            }

                            return cowf.getFormattedValue(formatterObj.format, fieldValue, options);
                        };
                    }

                    if (!contrail.checkIfExist(gridColumns[columnKey].id)) {
                        gridColumns[columnKey].id = columnValue.field + '_' + columnKey;
                    }
                });
            };

            function initGridBodyOptions(checkboxSelector) {
                if (contrail.checkIfExist(gridOptions)) {
                    var columns = [];
                    // Adds checkbox to all rows and header for select all functionality
                    if (gridOptions.checkboxSelectable != false) {
                        columns = [];
                        columns.push($.extend(true, {}, checkboxSelector.getColumnDefinition(), {
                            formatter: function (r, c, v, cd, dc) {
                                var selectedRows = (contrail.checkIfExist(grid)) ? grid.getSelectedRows() : [];
                                var enabled = true;
                                if (contrail.checkIfFunction(gridOptions.checkboxSelectable.enableRowCheckbox)) {
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
                            formatter: function (r, c, v, cd, dc) {
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
                                onClick: function (e, dc) {
                                    var target = e.target;
                                    if ($(target).hasClass('icon-caret-right')) {

                                        if (!$(target).parents('.slick-row-master').next().hasClass('slick-row-detail') || $(target).parents('.slick-row-master').next().hasClass('slick-row-detail-state-fetching')) {
                                            $(target).parents('.slick-row-master').next('.slick-row-detail').remove();
                                            var cellSpaceColumn = 0,
                                                cellSpaceRow = gridColumns.length - 1,
                                                fetchingCSSClass = (contrailListModel.isRequestInProgress() ? ' slick-row slick-row-detail-state-fetching' : '');

                                            //if (gridOptions.checkboxSelectable != false) {
                                            //    cellSpaceColumn++;
                                            //}

                                            $(target).parents('.slick-row-master').after(' \
                                                <div class="ui-widget-content slick-row slick-row-detail' + fetchingCSSClass + '" data-cgrid="' + $(target).parents('.slick-row-master').data('cgrid') + '"> \
                                                    <div class="slick-cell l' + cellSpaceColumn + ' r' + cellSpaceRow + '"> \
                                                        <div class="slick-row-detail-container"> \
                                                            <div class="slick-row-detail-template-' + $(target).parents('.slick-row-master').data('cgrid') + '"></div> \
                                                        </div> \
                                                    </div> \
                                                </div>');

                                            $(target).parents('.slick-row-master').next('.slick-row-detail').find('.slick-row-detail-container').show();

                                            // onInit called after building a template
                                            if (contrail.checkIfFunction(gridOptions.detail.onInit)) {
                                                e['detailRow'] = $(target).parents('.slick-row-master').next().find('.slick-row-detail-container');
                                                gridOptions.detail.onInit(e, dc);
                                            }
                                            refreshDetailTemplateById($(target).parents('.slick-row-master').data('cgrid'));

                                        }
                                        else {
                                            $(target).parents('.slick-row-master').next('.slick-row-detail').show();
                                        }

                                        if (contrail.checkIfFunction(gridOptions.detail.onExpand)) {
                                            gridOptions.detail.onExpand(e, dc);
                                        }
                                        $(target).removeClass('icon-caret-right').addClass('icon-caret-down');

                                        var slickRowDetail = $(target).parents('.slick-row-master').next('.slick-row-detail'),
                                            slickRowDetailHeight = slickRowDetail.height(),
                                            detailContainerHeight = slickRowDetail.find('.slick-row-detail-container').height();

                                        if (Math.abs(slickRowDetailHeight - detailContainerHeight) > 10) {
                                            gridContainer.data('contrailGrid').adjustDetailRowHeight(slickRowDetail.data('cgrid'))
                                        }
                                    } else if ($(target).hasClass('icon-caret-down')) {
                                        $(target).parents('.slick-row-master').next('.slick-row-detail').hide();

                                        if (contrail.checkIfFunction(gridOptions.detail.onCollapse)) {
                                            gridOptions.detail.onCollapse(e, dc);
                                        }
                                        $(target).removeClass('icon-caret-down').addClass('icon-caret-right');
                                    }
                                }
                            }
                        });
                        columns = columns.concat(gridColumns);
                        gridColumns = columns;

                        gridContainer.find('.slick-row-detail').live('click', function () {
                            var rowId = $(this).data('cgrid');

                            if (gridContainer.data('contrailGrid') != null) {
                                gridContainer.data('contrailGrid').adjustDetailRowHeight(rowId);
                            }
                        });
                    }

                    if (gridOptions.actionCell != false) {
                        columns = [];

                        if (gridOptions.actionCell instanceof Array || contrail.checkIfFunction(gridOptions.actionCell)) {
                            var optionList = gridOptions.actionCell
                            gridOptions.actionCell = {
                                type: 'dropdown',
                                optionList: optionList
                            };
                        }

                        if (gridOptions.actionCell.type == 'dropdown' && gridOptions.actionCell.optionList.length > 0) {
                            columns.push({
                                id: 'slick_action_cog',
                                field: "",
                                cssClass: 'action-cog-cell',
                                rerenderOnResize: false,
                                width: 20,
                                resizable: false,
                                formatter: function (r, c, v, cd, dc) {
                                    var actionCellArray = [];
                                    if (contrail.checkIfFunction(gridOptions.actionCell.optionList)) {
                                        actionCellArray = gridOptions.actionCell.optionList(dc);
                                    } else {
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
                        } else if (gridOptions.actionCell.type == 'link') {
                            columns.push({
                                id: 'slick_action_link',
                                field: "",
                                cssClass: 'action-link-cell',
                                rerenderOnResize: false,
                                width: 20,
                                resizable: false,
                                formatter: function (r, c, v, cd, dc) {
                                    return '<i class="' + gridOptions.actionCell.iconClass + ' icon-only grid-action-link"></i>';
                                },
                                searchable: false,
                                sortable: false,
                                exportConfig: {
                                    allow: false
                                }
                            });
                        }

                        if (gridOptions.actionCellPosition == 'start') {
                            columns = columns.concat(gridColumns);
                        } else {
                            columns = gridColumns.concat(columns);
                        }
                        gridColumns = columns;
                    }

                    if (contrail.checkIfExist(gridOptions.sortable.defaultSortCols)) {
                        $.each(gridOptions.sortable.defaultSortCols, function (defaultSortColKey, defaultSortColValue) {
                            gridSortColumns.push(defaultSortColValue);
                        });
                    }
                }
            };

            function refreshDetailTemplateById(id) {
                var source = gridOptions.detail.template,
                    templateKey = gridContainer.prop('id') + '-grid-detail-template';
                source = source.replace(/ }}/g, "}}");
                source = source.replace(/{{ /g, "{{");

                var template = contrail.getTemplate4Source(source, templateKey),
                    dc = dataView.getItemById(id);

                if (contrail.checkIfExist(dc)) {
                    if (contrail.checkIfExist(gridOptions.detail.templateConfig)) {
                        gridContainer.find('.slick-row-detail-template-' + id).html(template({dc: dc, templateConfig: gridOptions.detail.templateConfig}));
                    } else {
                        gridContainer.find('.slick-row-detail-template-' + id).html(template({data: dc, ignoreKeys: ['cgrid'], requestState: cowc.DATA_REQUEST_STATE_SUCCESS_NOT_EMPTY}));
                    }
                    gridContainer.data('contrailGrid').adjustDetailRowHeight(id);
                }
                else {
                    gridContainer.find('.slick-row-detail-template-' + id).parents('.slick-row-detail').remove();
                }
            };

            function initGridEvents() {
                eventHandlerMap.grid['onScroll'] = function (e, args) {
                    if (scrolledStatus.scrollLeft != args.scrollLeft || scrolledStatus.scrollTop != args.scrollTop) {
                        gridContainer.data('contrailGrid').adjustAllRowHeight();
                        scrolledStatus.scrollLeft = args.scrollLeft;
                        scrolledStatus.scrollTop = args.scrollTop;
                    }
                };

                grid['onScroll'].subscribe(eventHandlerMap.grid['onScroll']);

                eventHandlerMap.grid['onSelectedRowsChanged'] = function (e, args) {
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
                        gridContainer.find('.slick-cell-checkboxsel').find('input.rowCheckbox:visible').attr('checked', false);
                        $(gridContainer.find('.slick-cell-checkboxsel').find('input.rowCheckbox:visible')[args.rows.pop()]).attr('checked', true);
                    }
                };

                grid['onSelectedRowsChanged'].subscribe(eventHandlerMap.grid['onSelectedRowsChanged']);

                eventHandlerMap.grid['onHeaderClick'] = function (e, args) {
                    if ($(e.target).is(":checkbox")) {

                        if ($(e.target).is(":checked")) {
                            gridContainer.data('contrailGrid').setAllCheckedRows('current-page');

                            var pagingInfo = dataView.getPagingInfo(),
                                currentPageRecords = (pagingInfo.pageSize * (pagingInfo.pageNum + 1)) < pagingInfo.totalRows ? pagingInfo.pageSize : (pagingInfo.totalRows - (pagingInfo.pageSize * (pagingInfo.pageNum)))

                            if (pagingInfo.totalPages > 1 && !gridContainer.data('contrailGrid')._gridStates.allPagesDataChecked) {
                                gridContainer.find('.grid-check-all-info').remove();
                                gridContainer.find('.slick-header').after('<div class="alert alert-info grid-info grid-check-all-info"> ' +
                                    '<button type="button" class="close" data-dismiss="alert">&times;</button>' +
                                    '<strong>' + currentPageRecords + ' records checked.</strong> <a class="check-all-link">Click here to check all ' + pagingInfo.totalRows + ' records</a>' +
                                    '</div>');

                                gridContainer.find('.check-all-link')
                                    .off('click')
                                    .on('click', function (e) {
                                        gridContainer.data('contrailGrid').setAllCheckedRows('all-page');
                                        gridContainer.data('contrailGrid')._gridStates.allPagesDataChecked = true;

                                        gridContainer.find('.grid-check-all-info').remove();
                                        gridContainer.find('.slick-header').after('<div class="alert alert-info grid-info grid-check-all-info"> ' +
                                            '<button type="button" class="close" data-dismiss="alert">&times;</button>' +
                                            '<strong>' + pagingInfo.totalRows + ' records checked.</strong> <a class="clear-selection-link">Click here to clear selection</a>' +
                                            '</div>');

                                        gridContainer.find('.clear-selection-link')
                                            .off('click')
                                            .on('click', function (e) {
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
                    if (!gridOptions.disableRowsOnLoading || (gridOptions.disableRowsOnLoading && !contrailListModel.isRequestInProgress())) {
                        var column = grid.getColumns()[args.cell],
                            rowData = grid.getDataItem(args.row);
                        gridContainer.data('contrailGrid').selectedRow = args.row;
                        gridContainer.data('contrailGrid').selectedCell = args.cell;

                        if (contrail.checkIfExist(gridConfig.body.events) && contrail.checkIfFunction(gridConfig.body.events.onClick)) {
                            gridConfig.body.events.onClick(e, rowData);
                        }

                        if (contrail.checkIfExist(column.events) && contrail.checkIfFunction(column.events.onClick)) {
                            column.events.onClick(e, rowData);
                        }

                        if (gridOptions.rowSelectable) {
                            if (!gridContainer.find('.slick_row_' + rowData.cgrid).hasClass('selected_row')) {
                                gridContainer.find('.selected_row').removeClass('selected_row');
                                gridContainer.find('.slick_row_' + rowData.cgrid).addClass('selected_row');
                            }
                        }

                        if ($(e.target).hasClass("expander")) {
                            var selfParent = $(e.target).parent(),
                                jsonObj = {};
                            if(selfParent.children('.node').hasClass('raw')){
                                jsonObj = JSON.parse(selfParent.children('ul.node').text());
                                selfParent.empty().append(cowu.constructJsonHtmlViewer(jsonObj, 2, parseInt(selfParent.children('.node').data('depth')) + 1));
                            }
                            selfParent.children('.node').show();
                            selfParent.children('.collapsed').hide();
                            selfParent.children('i').removeClass('icon-plus').removeClass('expander').addClass('icon-minus').addClass('collapser');
                        } else if ($(e.target).hasClass("collapser")) {
                            var selfParent = $(e.target).parent();
                            selfParent.children('.collapsed').show();
                            selfParent.children('.node').hide();
                            selfParent.children('i').removeClass('icon-minus').removeClass('collapser').addClass('icon-plus').addClass('expander');
                        }

                        if ($(e.target).hasClass("grid-action-dropdown")) {
                            if ($('#' + gridContainer.prop('id') + '-action-menu-' + args.row).is(':visible')) {
                                $('#' + gridContainer.prop('id') + '-action-menu-' + args.row).remove();
                            } else {
                                $('.grid-action-menu').remove();
                                var actionCellArray = [];
                                if (contrail.checkIfFunction(gridOptions.actionCell.optionList)) {
                                    actionCellArray = gridOptions.actionCell.optionList(rowData);
                                } else {
                                    actionCellArray = gridOptions.actionCell.optionList;
                                }

                                //$('#' + gridContainer.prop('id') + '-action-menu').remove();
                                addGridRowActionDroplist(actionCellArray, gridContainer, args.row, $(e.target), rowData);
                                var offset = $(e.target).offset(), actionCellStyle = '';
                                if (gridOptions.actionCellPosition == 'start') {
                                    actionCellStyle = 'top:' + (offset.top + 20) + 'px' + ';right:auto !important;left:' + offset.left + 'px !important;';
                                } else {
                                    actionCellStyle = 'top:' + (offset.top + 20) + 'px' + ';left:' + (offset.left - 155) + 'px;';
                                }
                                $('#' + gridContainer.prop('id') + '-action-menu-' + args.row).attr('style', function (idx, obj) {
                                    if (obj != null) {
                                        return obj + actionCellStyle;
                                    } else {
                                        return actionCellStyle;
                                    }
                                }).show(function () {
                                    var dropdownHeight = $('#' + gridContainer.prop('id') + '-action-menu-' + args.row).height(),
                                        windowHeight = $(window).height(),
                                        currentScrollPosition = $(window).scrollTop(),
                                        actionScrollPosition = offset.top + 20 - currentScrollPosition;

                                    if ((actionScrollPosition + dropdownHeight) > windowHeight) {
                                        window.scrollTo(0, (actionScrollPosition + dropdownHeight) - windowHeight + currentScrollPosition);
                                    }
                                });
                                e.stopPropagation();
                                initOnClickDocument('#' + gridContainer.prop('id') + '-action-menu-' + args.row, function () {
                                    $('#' + gridContainer.prop('id') + '-action-menu-' + args.row).hide();
                                });
                            }
                        }

                        if ($(e.target).hasClass("grid-action-link")) {
                            if (gridOptions.actionCell.type == 'link') {
                                gridOptions.actionCell.onclick(e, args);
                            }
                        }

                        if (gridContainer.data('contrailGrid') != null) {
                            gridContainer.data('contrailGrid').adjustRowHeight(rowData.cgrid);
                        }
                    }
                };

                grid['onClick'].subscribe(eventHandlerMap.grid['onClick']);

            };

            function initOnClickDocument(containerIdentifier, callback) {
                $(document).on('click', function (e) {
                    if (!$(e.target).closest(gridContainer.find(containerIdentifier)).length) {
                        callback(e);
                    }
                });
            };

            function initDataView(gridConfig) {
                eventHandlerMap.dataView['onDataUpdate'] = function (e, args) {
                    //Display filtered count in grid header
                    if (gridConfig.header.showFilteredCntInHeader) {
                        var totalRowCnt, filteredRowCnt;
                        if (grid.getData() != null && grid.getData().getPagingInfo() != null) {
                            totalRowCnt = grid.getData().getItems().length;
                            filteredRowCnt = grid.getData().getPagingInfo()['totalRows']
                        }
                        if (totalRowCnt == filteredRowCnt) {
                            gridContainer.find('.grid-header-text').text(gridConfig.header.title.text + " (" + totalRowCnt + ")");
                        } else {
                            gridContainer.find('.grid-header-text').text(gridConfig.header.title.text + " (" + filteredRowCnt + " of " + totalRowCnt + ")");
                        }
                    }
                    //Refresh the grid only if it's not destroyed
                    if ($(gridContainer).data('contrailGrid') != null && (args.previous != args.current || args.rows.length > 0)) {
                        grid.invalidateAllRows();
                        grid.updateRowCount();
                        grid.render();

                        //onRowCount Changed
                        if (args.previous != args.current) {
                            gridContainer.data('contrailGrid').removeGridMessage();
                            if (dataView.getLength() == 0) {
                                emptyGridHandler();
                                gridContainer.find('.slick-row-detail').remove();
                            } else {
                                gridContainer.find('.grid-footer').removeClass('hide');
                                onDataGridHandler();
                            }
                        }

                        //onRows Changed
                        if (args.rows.length > 0) {
                            if (contrail.checkIfFunction(gridDataSource.events.onDataBoundCB)) {
                                gridDataSource.events.onDataBoundCB();
                            }

                            // Adjusting the row height for all rows
                            gridContainer.data('contrailGrid').adjustAllRowHeight();

                            // Assigning odd and even classes to take care of coloring effect on alternate rows
                            gridContainer.data('contrailGrid').adjustGridAlternateColors();

                            // Refreshing the detail view
                            gridContainer.data('contrailGrid').refreshDetailView();
                        }

                        if (contrail.checkIfFunction(gridDataSource.events.onDataUpdateCB)) {
                            gridDataSource.events.onDataUpdateCB(e, args);
                        }
                    } else if (dataView.getLength() == 0) {
                        emptyGridHandler();
                        gridContainer.find('.slick-row-detail').remove();
                    }
                };

                $.each(eventHandlerMap.dataView, function (key, val) {
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
                if (cols.length > 0) {
                    dataView.sort(function (dataRow1, dataRow2) {
                        for (var i = 0, l = cols.length; i < l; i++) {
                            var field = cols[i].sortCol.field;
                            var sortField = cols[i].sortCol.sortField;
                            if (sortField != null) {
                                field = sortField;
                            }
                            var sign = cols[i].sortAsc ? 1 : -1;
                            var result = 0;
                            var sortBy = contrail.checkIfExist(cols[i].sortCol.sortable.sortBy);
                            var value1,value2;
                            if(sortBy){
                                if(cols[i].sortCol.sortable.sortBy == 'formattedValue') {
                                    value1 = cols[i].sortCol.formatter('', '', '', '', dataRow1);
                                    value2 = cols[i].sortCol.formatter('', '', '', '', dataRow2);
                                } else {
                                    //It must be a function. Use it to get the value
                                    value1 =  cols[i].sortCol.sortable.sortBy(dataRow1);
                                    value2 =  cols[i].sortCol.sortable.sortBy(dataRow2);
                                }
                            } else {//default
                                value1 = dataRow1[field];
                                value2 = dataRow2[field];
                            }
                            if (cols[i].sortCol.sorter != null) {
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
                gridContainer.find('.input-searchbox input').on('keyup', function (e) {
                    var searchValue = this.value;
                    if (slickGridSearchtimer) {
                        window.clearTimeout(slickGridSearchtimer);
                    }
                    slickGridSearchtimer = setTimeout(function () {
                        if (searchValue == gridContainer.find('.input-searchbox input').val() && searchValue != null) {
                            dataView.setFilterArgs({
                                searchString: searchValue,
                                searchColumns: searchColumns
                            });
                            dataView.setFilter(searchFilter);
                            dataView.refresh();
                            if (dataView.getFilteredItems().length == 0) {
                                gridContainer.data('contrailGrid').showGridMessage('empty', 'No records found for "' + searchValue + '"')
                            }
                            gridContainer.find('.slick-row-detail').remove();
                            gridContainer.find('.input-searchbox input').focus();
                        }
                    }, 500);

                });

                initOnClickDocument('.input-searchbox', function (e) {
                    if (gridContainer.find('.input-searchbox').is(":visible") && gridContainer.find('.input-searchbox').find('input').val() == '') {
                        gridContainer.find('.input-searchbox').hide();
                        gridContainer.find('.link-searchbox').show();
                    }
                });
            };

            function initGridFooter() {
                if (gridContainer.data('contrailGrid') == null) {
                    return;
                }
                if (gridConfig.footer != false) {
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

                    if (dataView.getLength() != 0) {
                        gridContainer.find('.grid-footer').removeClass('hide');
                    } else if (contrail.checkIfKeyExistInObject(true, gridDataSource, 'remote.serverSidePagination') && gridDataSource.remote.serverSidePagination) {
                        footerPager = new GridFooterView(dataView, gridContainer, gridConfig.footer.pager.options);
                        footerPager.init();
                        //gridContainer.find('.slick-pager-sizes').hide();
                    } else {
                        footerPager = new GridFooterView(dataView, gridContainer, gridConfig.footer.pager.options);
                        footerPager.init();
                    }
                }
                gridContainer.data("contrailGrid")._pager = footerPager;
                startAutoRefresh(gridOptions.autoRefresh);
            };

            function setDataObject4ContrailGrid() {
                gridContainer.data('contrailGrid', {
                    _grid: grid,
                    _dataView: dataView,
                    _eventHandlerMap: eventHandlerMap,
                    _pager: footerPager,
                    _gridStates: {
                        allPagesDataChecked: false,
                        currentPageDataChecked: false
                    },
                    expand: function () {
                        gridContainer.find('i.collapse-icon').addClass('icon-chevron-up').removeClass('icon-chevron-down');
                        gridContainer.children().removeClass('collapsed');
                    },
                    collapse: function () {
                        gridContainer.find('i.collapse-icon').removeClass('icon-chevron-up').addClass('icon-chevron-down');
                        gridContainer.children().addClass('collapsed');
                        gridContainer.find('.grid-header').show();
                    },
                    // Returns an array of data of the checked rows via checkbox when checkboxSelectable is set to true
                    getCheckedRows: function () {
                        if (gridContainer.data('contrailGrid')._gridStates.allPagesDataChecked) {
                            return dataView.getFilteredItems();
                        } else {
                            var selectedRows = grid.getSelectedRows(),
                                returnValue = [];
                            $.each(selectedRows, function (selectedRowKey, selectedRowValue) {
                                returnValue.push(grid.getDataItem(selectedRowValue));
                            });
                            return returnValue;
                        }
                    },
                    // Sets the checked rows of the rows based on rowIndices
                    setCheckedRows: function (rowIndices) {
                        grid.setSelectedRows(rowIndices);
                    },
                    // Set All Checked Rows based on type == 'current-page' and 'all-page'
                    setAllCheckedRows: function (type) {
                        var rows = [], dataLength = 0;
                        if (type == 'all-page') {
                            dataLength = dataView.getFilteredItems().length;
                            for (var i = 0; i < dataLength; i++) {
                                var enabled = true;
                                if (contrail.checkIfFunction(gridOptions.checkboxSelectable.enableRowCheckbox)) {
                                    enabled = gridOptions.checkboxSelectable.enableRowCheckbox(dataView.getItemById('id_' + i));
                                }
                                if (enabled) {
                                    rows.push(i);
                                }
                            }
                        } else {
                            dataLength = grid.getDataLength();
                            for (var i = 0; i < dataLength; i++) {
                                if (gridContainer.find('.rowCheckbox[value="' + i + '"]:disabled').length == 0) {
                                    rows.push(i);
                                }
                            }
                        }
                        grid.setSelectedRows(rows);
                    },

                    getSelectedRow: function () {
                        return grid.getDataItem(gridContainer.data('contrailGrid').selectedRow);
                    },
                    deleteDataByRows: function (rowIndices) {
                        var cgrids = [];
                        $.each(rowIndices, function (key, val) {
                            var dataItem = grid.getDataItem(val);
                            cgrids.push(dataItem.cgrid);
                        });
                        dataView.deleteDataByIds(cgrids);
                    },
                    showGridMessage: function (status, customMsg) {
                        var gridStatusMsgConfig = gridConfig.body.statusMessages,
                            statusMsg = contrail.checkIfExist(customMsg) ? customMsg : (contrail.checkIfExist(gridStatusMsgConfig[status]) ? gridStatusMsgConfig[status].text : ''),
                            messageHtml;
                        this.removeGridMessage();

                        if (status == 'loading' || status == 'loadingNextPage') {
                            gridContainer.find('.grid-header-icon-loading').show();
                        }
                        if (status == 'error') {
                            messageHtml = '<i class="' + gridStatusMsgConfig[status].iconClasses + '"></i> &nbsp;' + statusMsg;
                            gridContainer.find('.grid-load-status').addClass('alert alert-error').html(messageHtml).removeClass('hide');
                        } else if (status != 'loadingNextPage') {
                            messageHtml = (contrail.checkIfExist(gridStatusMsgConfig[status])) ?
                            '<p class="' + gridStatusMsgConfig[status].type + '"><i class="' + gridStatusMsgConfig[status].iconClasses + '"></i> ' + statusMsg + '</p>' : status;
                            gridContainer.find('.grid-load-status').html(messageHtml).removeClass('hide');
                        }

                    },
                    removeGridMessage: function () {
                        gridContainer.find('.grid-load-status').html('').addClass('hide').removeClass('alert alert-error');
                        if (gridOptions.lazyLoading == null || !gridOptions.lazyLoading && gridOptions.defaultDataStatusMessage) {
                            this.removeGridLoading();
                        }
                    },
                    removeGridLoading: function () {
                        gridContainer.find('.grid-header-icon-loading').hide();
                        gridContainer.removeClass('grid-state-fetching');
                        gridContainer.removeClass('grid-state-fetching-rows');
                    },

                    adjustAllRowHeight: function () {
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

                    adjustRowHeightByChunk: function (rowChunks) {
                        if (!(gridOptions.fixedRowHeight != false && _.isNumber(gridOptions.fixedRowHeight))) {
                            var self = this;
                            setTimeout(function () {
                                $.each(rowChunks, function (chunkKey, chunkValue) {
                                    self.adjustRowHeight(chunkValue);
                                });
                            }, 5);
                        }
                    },

                    adjustRowHeight: function (rowId) {
                        if (!(gridOptions.fixedRowHeight != false && _.isNumber(gridOptions.fixedRowHeight))) {
                            var maxHeight = 20;
                            gridContainer.find('.slick_row_' + rowId).find('.slick-cell').each(function () {
                                maxHeight = ($(this).height() > maxHeight) ? $(this).height() : maxHeight;
                            });
                            maxHeight = maxHeight + 10;

                            gridContainer.find('.slick_row_' + rowId).height(maxHeight);
                        }
                    },
                    adjustDetailRowHeight: function (rowId) {
                        var slickdetailRow = gridContainer.find('.slick_row_' + rowId).next('.slick-row-detail'),
                            detailContainerHeight = slickdetailRow.find('.slick-row-detail-container').height();
                        slickdetailRow.height(detailContainerHeight + 10);
                        slickdetailRow.find('.slick-cell').height(detailContainerHeight);
                    },
                    adjustGridAlternateColors: function () {
                        gridContainer.find('.slick-row-master').removeClass('even').removeClass('odd');
                        gridContainer.find('.slick-row-master:visible:even').addClass('even');
                        gridContainer.find('.slick-row-master:visible:odd').addClass('odd');
                    },
                    destroy: function () {
                        stopAutoRefresh();
                        $.each(eventHandlerMap.dataView, function (key, val) {
                            dataView[key].unsubscribe(val);
                        });

                        $.each(eventHandlerMap.grid, function (key, val) {
                            grid[key].unsubscribe(val);
                        });

                        gridContainer.data('contrailGrid')._grid.destroy();
                        gridContainer.data('contrailGrid', null);
                        gridContainer.html('').removeClass('contrail-grid');
                    },
                    setRemoteAjaxConfig: function (ajaxConfig) {
                        if (contrail.checkIfExist(gridDataSource.remote.ajaxConfig)) {
                            dataView.setRemoteAjaxConfig(ajaxConfig);
                            dvConfig.remote.ajaxConfig = ajaxConfig;
                            gridDataSource.remote.ajaxConfig = ajaxConfig;
                            customGridConfig.body.dataSource.remote.ajaxConfig = ajaxConfig;
                            return true;
                        } else {
                            return false;
                        }
                    },
                    // Refreshes the grid if the grid data is fetched via ajax call
                    refreshGrid: function () {
                        if (contrail.checkIfExist(gridDataSource.remote) && contrail.checkIfExist(gridDataSource.remote.ajaxConfig.url)) {
                            gridContainer.contrailGrid(customGridConfig);
                        } else {
                            this.refreshView();
                        }
                    },
                    // Refreshes the Dataview if the grid data is fetched via ajax call
                    refreshData: function () {
                        if ((contrail.checkIfExist(gridDataSource.remote) && contrail.checkIfExist(gridDataSource.remote.ajaxConfig.url)) || (contrail.checkIfExist(gridDataSource.dataView) && contrail.checkIfFunction(dataView.refreshData))) {
                            dataView.refreshData();
                        }
                        currentSelectedRows = [];
                    },
                    // Refreshes the view of the grid. Grid is rendered and related adjustments are made.
                    refreshView: function (refreshDetailTemplateFlag) {
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
                    // Refreshes the detail view of the grid. Grid is rendered and related adjustments are made.
                    refreshDetailView: function (refreshDetailTemplateFlag) {
                        gridContainer.find('.slick-row-detail').each(function () {
                            if (gridContainer.find('.slick_row_' + $(this).data('cgrid')).is(':visible')) {
                                gridContainer.find('.slick_row_' + $(this).data('cgrid')).after($(this));
                                if ($(this).is(':visible')) {
                                    gridContainer.find('.slick_row_' + $(this).data('cgrid')).find('.toggleDetailIcon').addClass('icon-caret-down').removeClass('icon-caret-right');
                                }
                                if (refreshDetailTemplateFlag) {
                                    refreshDetailTemplateById($(this).data('cgrid'));
                                }
                            }
                            else {
                                $(this).remove();
                            }
                        });
                    },
                    // Starts AutoRefresh
                    startAutoRefresh: function (refreshPeriod) {
                        startAutoRefresh(refreshPeriod);
                    },
                    // Stops AutoRefresh
                    stopAutoRefresh: function () {
                        stopAutoRefresh();
                    }
                });
            };

            function generateGridHeaderTemplate(headerConfig) {
                var template = ' \
                <h4 class="grid-header-text smaller {{this.cssClass}}" data-action="collapse"> \
            		<i class="grid-header-icon-loading icon-spinner icon-spin"></i> \
                    <i class="grid-header-icon {{this.icon}} {{this.iconCssClass}} hide"></i> {{this.text}} \
                </h4>',
                    headerTemplate;

                if (headerConfig.defaultControls.collapseable) {
                    template += '\
                <div class="widget-toolbar pull-right"> \
                    <a class="widget-toolbar-icon" data-action="collapse"> \
                        <i class="collapse-icon icon-chevron-up"></i> \
                    </a> \
                </div>';
                }

                if (headerConfig.defaultControls.refreshable) {
                    template += '\
                <div class="widget-toolbar pull-right"> \
                    <a class="widget-toolbar-icon link-refreshable" title="Refresh" data-action="refresh"> \
                        <i class="icon-repeat"></i> \
                    </a> \
                </div>';
                }

                if (headerConfig.defaultControls.searchable) {
                    template += '\
                <div class="widget-toolbar pull-right"> \
                    <a class="widget-toolbar-icon link-searchbox" title="Search" data-action="search"> \
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

                if (headerConfig.defaultControls.exportable) {
                    template += '\
                    <div class="widget-toolbar pull-right"> \
                        <a class="widget-toolbar-icon" title="Export as CSV" data-action="export"> \
                            <i class="icon-download-alt"></i> \
                        </a> \
                    </div>';
                }

                if (headerConfig.defaultControls.columnPickable) {
                    var columnPickerConfig = {
                        type: 'checked-multiselect',
                        //iconClass: 'icon-columns',
                        placeholder: '',
                        elementConfig: {
                            elementId: 'columnPicker',
                            classes: 'columnPicker',
                            data: gridColumns,
                            dataTextField: 'text',
                            dataValueField: 'id',
                            noneSelectedText: '',
                            filterConfig: {
                                placeholder: 'Search Column Name'
                            },
                            parse: formatData4ColumnPicker,
                            minWidth: 200,
                            height: 250,
                            emptyOptionText: 'No Columns found.',
                            click: applyColumnPicker,
                            optgrouptoggle: applyColumnPicker,
                            control: false
                        }
                    };
                    if (!headerConfig.advanceControls) {
                        headerConfig.advanceControls = [];
                    }
                    headerConfig.advanceControls.push(columnPickerConfig);
                }

                if (headerConfig.customControls) {
                    $.each(headerConfig.customControls, function (key, val) {
                        template += '<div class="widget-toolbar pull-right">' + val + '</div>';
                    });
                }

                headerTemplate = '<div class="grid-header"><div id="' + gridContainer.prop('id') + '-header' + '" class="widget-header grid-widget-header">' + template + '</div></div>';
                headerTemplate += '<div class="widget-body-collapsed" data-action="widget-collapse"><a>Click here to expand <i class="icon-double-angle-down"></i></a> </div>';
                gridContainer.append(Handlebars.compile(headerTemplate)(gridConfig.header.title));

                if (headerConfig.advanceControls) {
                    $.each(headerConfig.advanceControls, function (key, control) {
                        if (control.type == 'link') {
                            addGridHeaderAction(key, control, gridContainer);
                        } else if (control.type == 'dropdown') {
                            addGridHeaderActionDroplist(key, control, gridContainer);
                        } else if (control.type == 'checked-multiselect') {
                            addGridHeaderActionCheckedMultiselect(key, control, gridContainer);
                        }
                    });
                }
            };

            function applyColumnPicker(event, ui) {
                var checkedColumns = $(gridContainer).find('#columnPicker').data('contrailCheckedMultiselect').getChecked();
                function getColumnIdsPicked(checkedColumns) {
                    var checkedColumnIds = [];
                    if (checkedColumns.length != 0) {
                        $.each(checkedColumns, function (checkedColumnKey, checkedColumnValue) {
                            var checkedColumnValueObj = $.parseJSON(unescape($(checkedColumnValue).val()));
                            checkedColumnIds.push(checkedColumnValueObj.value)
                        });
                    }
                    return checkedColumnIds;
                };
                var visibleColumnIds = getColumnIdsPicked(checkedColumns);
                var current = grid.getColumns().slice(0);
                var ordered = new Array(gridColumns.length);
                for (var i = 0; i < ordered.length; i++) {
                    if ( grid.getColumnIndex(gridColumns[i].id) === undefined ) {
                        // If the column doesn't return a value from getColumnIndex,
                        // it is hidden. Leave it in this position.
                        ordered[i] = gridColumns[i];
                    } else {
                        // Otherwise, grab the next visible column.
                        ordered[i] = current.shift();
                    }
                }
                gridColumns = ordered;
                var visibleColumns = [];

                // Columns which doesn't have a name associated will be by default set to visible.
                $.each(gridColumns, function(key, column) {
                    if (column.name === "") {
                        visibleColumns.push(column);
                    }
                });

                $.each(visibleColumnIds, function(key, id) {
                    $.each(gridColumns, function(key, column) {
                        //var idOrField = (column.id) ? column.id : column.field;
                        if (column.id == id) {
                            visibleColumns.push(column);
                        }
                    });
                });
                grid.setColumns(visibleColumns);
                gridContainer.data('contrailGrid').refreshView();
            };

            function formatData4ColumnPicker(data) {
                var pickColumns = [],
                    childrenData = [];
                $.each(data, function (key, value) {
                    var children = value,
                        selectedFlag = true;
                    // For columns set hide/hidden to true; should display as unchecked.
                    if (contrail.checkIfExist(children.hide) && (children.hide)) {
                          selectedFlag = false;
                    }
                    if (contrail.checkIfExist(children.hidden) && (children.hidden)) {
                        selectedFlag = false;
                    }
                    // In some cases id may not be present in the config; construct the id using field and key.
                    var id = (children.id) ? children.id : children.field + '_' + key;
                    if (!contrail.checkIfExist(children.allowColumnPickable) || children.allowColumnPickable !== false) {
                        childrenData.push({'id': id, 'text': children.name, 'selected': selectedFlag});
                    }
                });
                pickColumns.push({'id': 'columns', 'text': 'Show/Hide Columns', children: childrenData});
                return pickColumns;
            };

            function addGridHeaderAction(key, actionConfig, gridContainer) {
                var actionId = gridContainer.prop('id') + '-header-action-' + key;
                var action = $('<div class="widget-toolbar pull-right"><a ' + (contrail.checkIfExist(actionConfig.linkElementId) ? 'id="' + actionConfig.linkElementId + '" ' : '') +
                    ' class="widget-toolbar-icon' + (contrail.checkIfExist(actionConfig.disabledLink) ? ' disabled-link' : '') + '" ' +
                    'title="' + actionConfig.title + '">' +
                    '<i class="' + actionConfig.iconClass + '"></i></a>' +
                    '</div>').appendTo('#' + gridContainer.prop('id') + '-header');

                $(action).on('click', function (event) {
                    actionConfig.onClick(event, gridContainer);
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
                        if(typeof actionItemConfig.onClick === 'function') {
                            actionItemConfig.onClick();
                        }
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

                if (actionConfig.disabledLink) {
                    $('#' + actionId).find('.input-icon').data('contrailCheckedMultiselect').disable();
                }

//            if($('#' + actionId).find('.input-icon').data('contrailCheckedMultiselect').getChecked().length > 0){
//            	gridContainer.find('.input-multiselectbox').show();
//   	        	gridContainer.find('.link-multiselectbox').hide();
//   	        }

                /*
                 for column picker we don't need to display selected items on the grid header.
                 Quick Fix: will find the id and set the css.
                 */
                if (actionConfig.elementConfig.elementId == "columnPicker") {
                    //if ($(gridContainer).find(".input-multiselectbox #columnPicker button span:not(.ui-icon)").is(":visible")) {
                        $(gridContainer).find(".input-multiselectbox #columnPicker button span:not(.ui-icon)").css({"display":"none"});
                        $(gridContainer).find(".input-multiselectbox #columnPicker button")
                            .html('<i class="icon icon-columns"></i>')
                            .css({'width':'25px', 'padding-left': '10px', 'border': 'none'});
                    //}


                }
            };

            function addGridRowActionDroplist(actionConfig, gridContainer, rowIndex, targetElement, rowData) {
                var menuClass = 'dropdown-menu pull-right dropdown-caret grid-action-menu';
                if (gridOptions.actionCellPosition == 'start') {
                    menuClass = 'dropdown-menu pull-left dropdown-caret grid-action-menu';
                }
                var gridActionId = $('<ul id="' + gridContainer.prop('id') + '-action-menu-' + rowIndex + '" class="' + menuClass + '"></ul>').appendTo('body');
                $.each(actionConfig, function (key, actionItemConfig) {
                    if (actionItemConfig.divider) {
                        $('<li class="divider"></li>').appendTo('#' + gridContainer.prop('id') + '-action-menu-' + rowIndex);
                    }

                    var actionItem = $('\
                    <li><a class="tooltip-success" data-rel="tooltip" data-placement="left" data-original-title="' + actionItemConfig.title + '"> \
                        <i class="' + actionItemConfig.iconClass + ' margin-right-10"></i>' + actionItemConfig.title + '</a> \
                    </li>').appendTo('#' + gridContainer.prop('id') + '-action-menu-' + rowIndex);

                    $(actionItem).on('click', function () {
                        actionItemConfig.onClick(rowIndex, targetElement, rowData);
                        gridActionId.remove();
                    });
                });
            };

            function emptyGridHandler() {
                if (!gridOptions.lazyLoading && gridOptions.defaultDataStatusMessage && gridContainer.data('contrailGrid')) {
                    gridContainer.data('contrailGrid').showGridMessage('empty');
                    if (gridOptions.checkboxSelectable != false) {
                        gridContainer.find('.headerRowCheckbox').attr('disabled', true);
                    }
                }
            };

            function errorGridHandler(errorMsg) {
                if (gridContainer.data('contrailGrid') != null) {
                    gridContainer.data('contrailGrid').showGridMessage('error', 'Error: ' + errorMsg);
                }
                if (gridOptions.checkboxSelectable != false) {
                    gridContainer.find('.headerRowCheckbox').attr('disabled', true);
                }
            };

            function onDataGridHandler() {
                if (gridOptions.checkboxSelectable != false) {
                    var disabled = true;
                    gridContainer.find('.rowCheckbox').each(function () {
                        disabled = disabled && (!contrail.checkIfExist($(this).attr('disabled')));
                    });

                    if (!disabled) {
                        gridContainer.find('.headerRowCheckbox').attr('disabled', true);
                    } else {
                        gridContainer.find('.headerRowCheckbox').removeAttr('disabled');
                    }
                }
            };
        }
    });

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

    return GridView;
});

/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */

define('core-basedir/js/views/AccordianView',[
    'underscore',
    'contrail-view'
], function (_, ContrailView) {
    var AccordianView = ContrailView.extend({
        render: function () {
            var accordianTempl = contrail.getTemplate4Id(cowc.TMPL_ACCORDIAN_VIEW),
                viewConfig = this.attributes.viewConfig,
                elId = this.attributes.elementId,
                validation = this.attributes.validation,
                lockEditingByDefault = this.attributes.lockEditingByDefault,
                errorObj = this.model.model().get(cowc.KEY_MODEL_ERRORS),
                childViewObj, childElId, childElIdArray;

            this.$el.html(accordianTempl({viewConfig: viewConfig, elementId: elId}));

            for (var i = 0; i < viewConfig.length; i++) {
                childViewObj = viewConfig[i];
                childElId = childViewObj[cowc.KEY_ELEMENT_ID];

                this.model.showErrorAttr(childElId, getKOComputedError(viewConfig[i], this));

                this.renderView4Config(this.$el.find("#" + childElId), this.model, childViewObj, validation, lockEditingByDefault);
            }

            this.$el.find("#" + elId).accordion({
                heightStyle: "content",
                collapsible: true
            });
        }
    });

    var getKOComputedError = function (childViewObj, that) {
        var childElIdArray = getElementIds4Section(childViewObj[cowc.KEY_VIEW_CONFIG]),
            koComputedFunc = ko.computed(function () {
                var value = false;
                for(var i = 0; i < childElIdArray.length; i ++) {
                    var item = childElIdArray[i],
                        errorName = item + cowc.ERROR_SUFFIX_ID;
                    if(item != null && this.model.errors()[errorName] != null) {
                        var idError = this.model.errors()[errorName]();

                        if (idError) {
                            value = true;
                        }
                    }
                };
                return value;
            }, that);

        return koComputedFunc;
    };

    var getElementIds4Section = function (sectionConfig) {
        var rows = sectionConfig[cowc.KEY_ROWS],
            columns, elementIds = [];
        for (var i = 0; i < rows.length; i++) {
            columns = rows[i][cowc.KEY_COLUMNS];
            for (var j = 0; j < columns.length; j++) {
                elementIds.push(columns[j][cowc.KEY_ELEMENT_ID]);
            }
        }
        return elementIds;
    };

    return AccordianView;
});
/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */

define('core-basedir/js/views/DetailsView',[
    'underscore',
    'contrail-view'
], function (_, ContrailView) {
    var DetailsView = ContrailView.extend({
        render: function () {
            var self = this,
                viewConfig = self.attributes.viewConfig,
                data = viewConfig['data'],
                ajaxConfig = viewConfig['ajaxConfig'],
                dataParser = viewConfig['dataParser'],
                modelMap = this.modelMap;

            if(contrail.checkIfExist(data)) {
                self.renderDetailView({data: data, requestState: cowc.DATA_REQUEST_STATE_SUCCESS_NOT_EMPTY});
            } else {
                self.renderDetailView({data: [], requestState: cowc.DATA_REQUEST_STATE_FETCHING});

                if (modelMap != null && modelMap[viewConfig['modelKey']] != null) {
                    var contrailViewModel = modelMap[viewConfig['modelKey']],
                        attributes, requestState;

                    if (!contrailViewModel.isRequestInProgress()) {
                        requestState = cowu.getRequestState4Model(contrailViewModel);
                        attributes = contrailViewModel.attributes;
                        self.renderDetailView({data: attributes, requestState: requestState});

                    } else {
                        contrailViewModel.onAllRequestsComplete.subscribe(function () {
                            requestState = cowu.getRequestState4Model(contrailViewModel);
                            attributes = contrailViewModel.attributes;
                            self.renderDetailView({data: attributes, requestState: requestState});
                        });
                    }
                } else {
                    contrail.ajaxHandler(ajaxConfig, null, function (response) {
                        var parsedData = dataParser(response),
                            requestState = cowc.DATA_REQUEST_STATE_SUCCESS_NOT_EMPTY;

                        if ($.isEmptyObject(parsedData)) {
                            requestState = cowc.DATA_REQUEST_STATE_SUCCESS_EMPTY;
                        }

                        self.renderDetailView({data: parsedData, requestState: requestState});
                    }, function (error) {
                        self.renderDetailView({data: [], requestState: cowc.DATA_REQUEST_STATE_ERROR});
                    });
                }
            }
        },

        renderDetailView: function(detailDataObj) {
            var self = this,
                viewConfig = self.attributes.viewConfig,
                app = viewConfig['app'],
                templateConfig = viewConfig['templateConfig'],
                detailsTemplate = cowu.generateDetailTemplate(templateConfig, app);

            self.$el.html(detailsTemplate(detailDataObj));

            if (detailDataObj.requestState !== cowc.DATA_REQUEST_STATE_ERROR) {
                initClickEvents(self.$el, templateConfig, detailDataObj.data);
            }
        }
    });

    function initClickEvents(detailEl, templateConfig, data) {
        initActionClickEvents(detailEl, templateConfig, data);
        initWidgetViewEvents(detailEl);
        initDetailDataClickEvents(detailEl, templateConfig, data);

    };

    function initActionClickEvents(detailEl, templateConfig, data) {
        var actions = templateConfig.actions
        if (_.isArray(actions)) {
            $.each(actions, function(actionKey, actionValue) {
                if(actionValue.type == 'dropdown') {
                    $.each(actionValue.optionList, function(optionListKey, optionListValue) {
                        $(detailEl).find('[data-title="' + actionValue.title + '"]').find('[data-title="' + optionListValue.title + '"]')
                            .off('click')
                            .on('click', function(e) {
                                optionListValue.onClick(data);
                            })

                    });
                }
            })
        }
    };

    function initWidgetViewEvents(detailEl) {
        $(detailEl).find('[data-action="list-view"]')
            .off('click')
            .on('click', function (event) {
                $(this).parents('.widget-box').find('.list-view').show();
                $(this).parents('.widget-box').find('.advanced-view').hide();
                $(this).parents('.widget-box').find('.contrail-status-view').hide();
            });

        $(detailEl).find('[data-action="advanced-view"]')
            .off('click')
            .on('click', function (event) {
                $(this).parents('.widget-box').find('.advanced-view').show();
                $(this).parents('.widget-box').find('.list-view').hide();
                $(this).parents('.widget-box').find('.contrail-status-view').hide();
            })
    };

    function initDetailDataClickEvents (detailEl, templateConfig, data) {
        if (templateConfig.templateGenerator === 'ColumnSectionTemplateGenerator') {
            $.each(templateConfig.templateGeneratorConfig.columns, function (columnKey, columnValue) {
                $.each(columnValue.rows, function (rowKey, rowValue) {
                    initDetailDataClickEvents(detailEl, rowValue, data)
                });
            });
        }

        if (templateConfig.templateGenerator === 'BlockListTemplateGenerator') {
            $.each(templateConfig.templateGeneratorConfig, function (configKey, configValue) {
                initDetailDataClickEvents(detailEl, configValue, data)
            });
        }

        if (templateConfig.templateGenerator === 'TextGenerator') {
            if (contrail.checkIfExist(templateConfig.events)) {
                $.each(templateConfig.events, function (eventKey, eventValue) {
                    $(detailEl).find('.' + templateConfig.key + '-value')
                        .off(eventKey)
                        .on(eventKey, function (event) {
                            eventValue(event, data);
                        });
                });
            }
        }

        if (templateConfig.templateGenerator === 'LinkGenerator') {
            //TODO
        }
    }

    return DetailsView;
});
/*
 ##Juniper License

 Copyright (c) 2014 Juniper Networks, Inc.

 ##nvd3.js License

 Copyright (c) 2011-2014 [Novus Partners, Inc.][novus]

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.

 [novus]: https://www.novus.com/

 ##d3.js License

 Copyright (c) 2012, Michael Bostock
 All rights reserved.

 Redistribution and use in source and binary forms, with or without
 modification, are permitted provided that the following conditions are met:

 * Redistributions of source code must retain the above copyright notice, this
 list of conditions and the following disclaimer.

 * Redistributions in binary form must reproduce the above copyright notice,
 this list of conditions and the following disclaimer in the documentation
 and/or other materials provided with the distribution.

 * The name Michael Bostock may not be used to endorse or promote products
 derived from this software without specific prior written permission.

 THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 DISCLAIMED. IN NO EVENT SHALL MICHAEL BOSTOCK BE LIABLE FOR ANY DIRECT,
 INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
 BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
 EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

define('core-basedir/js/models/DonutChartModel',[], function () {
    /**
     * This chart model accepts data in following format:
     * [{label: '', value: },{..}]
     * @param chartOptions
     * @returns DonutChartModel
     */
    var DonutChartModel = function (chartOptions) {

        nv.models.donutChart = function() {
            "use strict";

            //============================================================
            // Public Variables with Default Settings
            //------------------------------------------------------------
            var pie = nv.models.pie();
            var legend = nv.models.legend();
            var tooltip = nv.models.tooltip();

            var margin = {top: 0, right: 0, bottom: 0, left: 0}
                , width = null
                , height = null
                , showLegend = true
                , legendPosition = "right"
                , color = d3.scale.category20()
                , state = nv.utils.state()
                , defaultState = null
                , noData = null
                , duration = 250
                , dispatch = d3.dispatch('tooltipShow', 'tooltipHide', 'stateChange', 'changeState','renderEnd')
                ;

            tooltip
                .headerEnabled(false)
                .duration(0)
                .valueFormatter(function(d, i) {
                    return pie.valueFormat()(d, i);
                });

            //============================================================
            // Private Variables
            //------------------------------------------------------------

            var renderWatch = nv.utils.renderWatch(dispatch);

            var stateGetter = function(data) {
                return function(){
                    return {
                        active: data.map(function(d) { return !d.disabled })
                    };
                }
            };

            var stateSetter = function(data) {
                return function(state) {
                    if (state.active !== undefined) {
                        data.forEach(function (series, i) {
                            series.disabled = !state.active[i];
                        });
                    }
                }
            };

            //============================================================
            // Chart function
            //------------------------------------------------------------

            function chart(selection) {
                renderWatch.reset();
                renderWatch.models(pie);

                selection.each(function(chartDataObj) {
                    var container = d3.select(this),
                        data = chartDataObj.data,
                        requestState = chartDataObj.requestState;

                    nv.utils.initSVG(container);

                    var that = this;
                    var availableWidth = nv.utils.availableWidth(width, container, margin),
                        availableHeight = nv.utils.availableHeight(height, container, margin);

                    chart.update = function() { container.transition().call(chart); };
                    chart.container = this;

                    state.setter(stateSetter(data), chart.update)
                        .getter(stateGetter(data))
                        .update();

                    //set state.disabled
                    state.disabled = data.map(function(d) { return !!d.disabled });

                    if (!defaultState) {
                        var key;
                        defaultState = {};
                        for (key in state) {
                            if (state[key] instanceof Array)
                                defaultState[key] = state[key].slice(0);
                            else
                                defaultState[key] = state[key];
                        }
                    }

                    // //Display No Data message if there's nothing to show.
                    //if (!data || !data.length) {
                    //    nv.utils.noData(chart, container);
                    //   // return chart;
                    //} else {
                    //    container.selectAll('.nv-noData').remove();
                    //}

                    // Setup containers and skeleton of chart
                    var wrap = container.selectAll('g.nv-wrap.nv-pieChart').data([data]);
                    var gEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap nv-pieChart').append('g');
                    var g = wrap.select('g');

                    gEnter.append('g').attr('class', 'nv-pieWrap');
                    gEnter.append('g').attr('class', 'nv-legendWrap');

                    // Legend
                    if (showLegend) {
                        if (legendPosition === "top") {
                            legend.width( availableWidth ).key(pie.x());

                            wrap.select('.nv-legendWrap')
                                .datum(data)
                                .call(legend);

                            if ( margin.top != legend.height()) {
                                margin.top = legend.height();
                                availableHeight = nv.utils.availableHeight(height, container, margin);
                            }

                            wrap.select('.nv-legendWrap')
                                .attr('transform', 'translate(0,' + (-margin.top) +')');
                        } else if (legendPosition === "right") {
                            var legendWidth = nv.models.legend().width();

                            if (availableWidth / 4 < legendWidth) {
                                legendWidth = (availableWidth / 4)
                            }

                            legend.height(availableHeight).key(pie.x());
                            legend.width(legendWidth);
                            availableWidth -= legend.width();

                            wrap.select('.nv-legendWrap')
                                .datum(data)
                                .call(legend)
                                .attr('transform', 'translate(' + (availableWidth + 10) +',0)');
                        }
                    }
                    wrap.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

                    // Main Chart Component(s)
                    pie.width(availableWidth).height(availableHeight);
                    var pieWrap = g.select('.nv-pieWrap').datum([data]);
                    d3.transition(pieWrap).call(pie);
                });

                renderWatch.renderEnd('pieChart immediate');
                return chart;
            }

            //============================================================
            // Event Handling/Dispatching (out of chart's scope)
            //------------------------------------------------------------

            pie.dispatch.on('elementMouseover.tooltip', function(evt) {
                evt['series'] = {
                    key: chart.x()(evt.data),
                    value: chart.y()(evt.data),
                    color: evt.color
                };
                tooltip.data(evt).hidden(false);
            });

            pie.dispatch.on('elementMouseout.tooltip', function(evt) {
                tooltip.hidden(true);
            });

            pie.dispatch.on('elementMousemove.tooltip', function(evt) {
                tooltip.position({top: d3.event.pageY, left: d3.event.pageX})();
            });

            //============================================================
            // Expose Public Variables
            //------------------------------------------------------------

            // expose chart's sub-components
            chart.legend = legend;
            chart.dispatch = dispatch;
            chart.pie = pie;
            chart.tooltip = tooltip;
            chart.options = nv.utils.optionsFunc.bind(chart);

            // use Object get/set functionality to map between vars and chart functions
            chart._options = Object.create({}, {
                // simple options, just get/set the necessary values
                noData:         {get: function(){return noData;},         set: function(_){noData=_;}},
                showLegend:     {get: function(){return showLegend;},     set: function(_){showLegend=_;}},
                legendPosition: {get: function(){return legendPosition;}, set: function(_){legendPosition=_;}},
                defaultState:   {get: function(){return defaultState;},   set: function(_){defaultState=_;}},

                // deprecated options
                tooltips:    {get: function(){return tooltip.enabled();}, set: function(_){
                    // deprecated after 1.7.1
                    nv.deprecated('tooltips', 'use chart.tooltip.enabled() instead');
                    tooltip.enabled(!!_);
                }},
                tooltipContent:    {get: function(){return tooltip.contentGenerator();}, set: function(_){
                    // deprecated after 1.7.1
                    nv.deprecated('tooltipContent', 'use chart.tooltip.contentGenerator() instead');
                    tooltip.contentGenerator(_);
                }},

                // options that require extra logic in the setter
                color: {get: function(){return color;}, set: function(_){
                    color = _;
                    legend.color(color);
                    pie.color(color);
                }},
                duration: {get: function(){return duration;}, set: function(_){
                    duration = _;
                    renderWatch.reset(duration);
                }},
                margin: {get: function(){return margin;}, set: function(_){
                    margin.top    = _.top    !== undefined ? _.top    : margin.top;
                    margin.right  = _.right  !== undefined ? _.right  : margin.right;
                    margin.bottom = _.bottom !== undefined ? _.bottom : margin.bottom;
                    margin.left   = _.left   !== undefined ? _.left   : margin.left;
                }}
            });
            nv.utils.inheritOptions(chart, pie);
            nv.utils.initOptions(chart);
            return chart;
        };

        var chartModel = nv.models.donutChart()
            .donut(true)
            .x(function(d) { return d.label })
            .y(function(d) { return d.value })
            .margin(chartOptions.margin)
            .height(chartOptions.height)
            .donutRatio(chartOptions.donutRatio)
            .showLegend(chartOptions.showLegend)
            .legendPosition(chartOptions.legendPosition)
            .showLabels(chartOptions.showLabels)
            .noData(chartOptions.noDataMessage);

        chartModel.tooltip.enabled(chartOptions.showTooltips);
        chartModel.pie.valueFormat(chartOptions.valueFormat);
        chartModel.legend.rightAlign(chartOptions.legendRightAlign)
            .padding(chartOptions.legendPadding);

        return chartModel;
    }
    return DonutChartModel;
});
/*
 * Copyright (c) 2015 Juniper Networks, Inc. All rights reserved.
 */

define('core-basedir/js/views/DonutChartView',[
    'underscore',
    'contrail-view',
    'core-basedir/js/models/DonutChartModel',
    'contrail-list-model'
], function (_, ContrailView, DonutChartModel, ContrailListModel) {
    var DonutChartView = ContrailView.extend({
        render: function () {
            var self = this,
                viewConfig = self.attributes.viewConfig,
                ajaxConfig = viewConfig['ajaxConfig'],
                selector = $(self.$el);

            if (self.model === null && viewConfig['modelConfig'] !== null) {
                self.model = new ContrailListModel(viewConfig['modelConfig']);
            }

            self.renderChart(selector, viewConfig, self.model);

            if (self.model !== null) {
                if(self.model.loadedFromCache || !(self.model.isRequestInProgress())) {
                    self.renderChart(selector, viewConfig, self.model);
                }

                self.model.onAllRequestsComplete.subscribe(function() {
                    self.renderChart(selector, viewConfig, self.model);
                });

                if(viewConfig.loadChartInChunks) {
                    self.model.onDataUpdate.subscribe(function() {
                        self.renderChart(selector, viewConfig, self.model);
                    });
                }
            }
        },

        renderChart: function (selector, viewConfig, chartViewModel) {
            var data = chartViewModel.getItems(),
                chartTemplate = contrail.getTemplate4Id(cowc.TMPL_CHART),
                chartViewConfig, chartModel, chartData, chartOptions,
                widgetConfig = contrail.checkIfExist(viewConfig.widgetConfig) ? viewConfig.widgetConfig : null;

            if (contrail.checkIfFunction(viewConfig['parseFn'])) {
                data = viewConfig['parseFn'](data);
            }

            chartViewConfig = getChartViewConfig(data, viewConfig);
            chartOptions = chartViewConfig['chartOptions'];
            chartModel = new DonutChartModel(chartOptions);

            this.chartModel = chartModel;

            if ($(selector).find("svg") != null) {
                $(selector).empty();
            }

            $(selector).append(chartTemplate(chartOptions));

            //Store the chart object as a data attribute so that the chart can be updated dynamically
            $(selector).data('chart', chartModel);

            if (!($(selector).is(':visible'))) {
                $(selector).find('svg').bind("refresh", function () {
                    setData2Chart(selector, chartViewConfig, chartViewModel, chartModel);
                });
            } else {
                setData2Chart(selector, chartViewConfig, chartViewModel, chartModel);
            }

            nv.utils.windowResize(function () {
                chUtils.updateChartOnResize(selector, chartModel);
            });

            if (chartOptions['deferredObj'] != null)
                chartOptions['deferredObj'].resolve();

            if (widgetConfig !== null) {
                this.renderView4Config(selector.find('.chart-container'), self.model, widgetConfig, null, null, null);
            }

        }
    });

    function setData2Chart(selector, chartViewConfig, chartViewModel, chartModel) {

        var chartData = chartViewConfig.chartData,
            checkEmptyDataCB = function (data) {
                return (!data || data.length === 0);
            },
            chartDataRequestState = cowu.getRequestState4Model(chartViewModel, chartData, checkEmptyDataCB),
            chartDataObj = {
                data: chartData,
                requestState: chartDataRequestState
            },
            chartOptions = chartViewConfig['chartOptions'];

        d3.select($(selector)[0]).select('svg').datum(chartDataObj).call(chartModel);

        if (chartDataRequestState !== cowc.DATA_REQUEST_STATE_SUCCESS_NOT_EMPTY) {
            var container = d3.select($(selector).find("svg")[0]),
                requestStateText = container.selectAll('.nv-requestState').data([cowm.getRequestMessage(chartDataRequestState)]),
                textPositionX = $(selector).width() / 2,
                textPositionY = chartOptions.height / 2;

            requestStateText
                .enter().append('text')
                .attr('class', 'nvd3 nv-requestState')
                .attr('dy', '-.7em')
                .style('text-anchor', 'middle');

            requestStateText
                .attr('x', textPositionX)
                .attr('y', textPositionY)
                .text(function(t){ return t; });

        } else {
            $(selector).find('.nv-requestState').remove();
        }
    }

    function getChartViewConfig(chartData, viewConfig) {
        var chartViewConfig = {},
            chartOptions = ifNull(viewConfig['chartOptions'], {}),
            chartDefaultOptions = {
                margin: {top: 0, right: 0, bottom: 0, left: 0},
                height: 250,
                showLegend: false,
                legendPosition: "top",
                showLabels: true,
                showTooltips: true,
                valueFormat: function (d) {
                    return d;
                },
                donutRatio: 0.5,
                color: d3.scale.category10(),
                noDataMessage: "Unable to get data"
            };

        chartOptions = $.extend(true, {}, chartDefaultOptions, chartOptions);

        var dataZero = true;
        _.each(chartData, function(data) {
            if(data.value != 0) {
                dataZero = false;
            }
        });
        if(dataZero) {
            chartOptions['noDataMessage'] = "All values are 0.";
            chartData = [];
        }

        chartViewConfig['chartData'] = chartData;
        chartViewConfig['chartOptions'] = chartOptions;

        return chartViewConfig;
    };

    return DonutChartView;
});
/*
 * Copyright (c) 2015 Juniper Networks, Inc. All rights reserved.
 */

define('core-basedir/js/views/FormAutoCompleteTextBoxView',[
    'underscore',
    'contrail-view'
], function (_, ContrailView) {
    var FormAutoCompleteTextBoxView = ContrailView.extend({
        render: function () {
            var self = this,
                autocompleteTextboxTemplate = contrail.getTemplate4Id(cowc.
                        TMPL_AUTOCOMPLETETEXTBOX_VIEW),
                viewConfig = self.attributes.viewConfig,
                elId = self.attributes.elementId,
                app = self.attributes.app,
                elementConfig = viewConfig[cowc.KEY_ELEMENT_CONFIG],
                path = viewConfig[cowc.KEY_PATH],
                lockEditingByDefault = self.attributes.lockEditingByDefault,
                label = viewConfig.label,
                labelValue = (label != null)? label :((elId != null)?
                        cowl.get(elId, app) : cowl.get(path, app)),
                tmplParameters;

            if (!(contrail.checkIfExist(lockEditingByDefault) &&
                    lockEditingByDefault)) {
                lockEditingByDefault = false;
            }
            this.model.initLockAttr(path, lockEditingByDefault);

            tmplParameters = {
                label: labelValue, id: elId + '_autocompletetextbox',
                    name: elId, dataBindValue: viewConfig[cowc.KEY_DATABIND_VALUE],
                lockAttr: lockEditingByDefault, class: "span12",
                    elementConfig: elementConfig
            };

            self.$el.html(autocompleteTextboxTemplate(tmplParameters));

            var currentElementConfigMap = this.model.model().
                get('elementConfigMap');
            if(!contrail.checkIfExist(currentElementConfigMap)){
                currentElementConfigMap = {};
                this.model.model().set('elementConfigMap',
                        currentElementConfigMap);
            }

            currentElementConfigMap[elId] = elementConfig;
        }
    });

    return FormAutoCompleteTextBoxView;
});
/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */

define('core-basedir/js/views/FormButtonView',[
    'underscore',
    'contrail-view'
], function (_, ContrailView) {
    var FormButtonView = ContrailView.extend({
        render: function () {
            var self = this,
                buttonTemplate = contrail.getTemplate4Id(cowc.TMPL_BUTTON_VIEW),
                viewConfig = self.attributes.viewConfig,
                elId = self.attributes.elementId,
                app = self.attributes.app,
                elementConfig = viewConfig.elementConfig, tmplParameters;

            viewConfig.label = (viewConfig.label != null)? viewConfig.label : ((elId != null)? cowl.get(elId, app) : cowl.get(path, app));

            tmplParameters = { id: elId, name: elId, class: "span3", viewConfig: viewConfig };

            self.$el.html(buttonTemplate(tmplParameters));
        }
    });

    return FormButtonView;
});

/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */

define('core-basedir/js/views/FormCheckboxView',[
    'underscore',
    'contrail-view'
], function (_, ContrailView) {
    var FormCheckboxView = ContrailView.extend({
        render: function () {
            var self = this,
                viewConfig = self.attributes.viewConfig,
                checkBoxTemplate = contrail.getTemplate4Id((viewConfig.templateId) ? viewConfig.templateId: cowc.TMPL_CHECKBOX_VIEW),
                elId = self.attributes.elementId,
                app = self.attributes.app,
                validation = self.attributes.validation,
                path = viewConfig['path'],
                type = (viewConfig['type'] != null) ? viewConfig['type'] : 'checkbox',
                label = viewConfig.label,
                lockEditingByDefault = self.attributes.lockEditingByDefault,
                labelValue = (label != null)? label :((elId != null)? cowl.get(elId, app) : cowl.get(path, app)),
                tmplParameters;

            if (!(contrail.checkIfExist(lockEditingByDefault) && lockEditingByDefault)) {
                lockEditingByDefault = false;
            }
            self.model.initLockAttr(path, lockEditingByDefault);

            tmplParameters = {
                id: elId, name: elId, type: type, class: "span12",
                label: labelValue,  viewConfig: viewConfig,
                lockAttr: lockEditingByDefault, validation: validation
            };
            self.$el.html(checkBoxTemplate(tmplParameters));
        }
    });

    return FormCheckboxView;
});
/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */

define('core-basedir/js/views/FormCollectionView',[
    'underscore',
    'contrail-view'
], function (_, ContrailView) {
    var FormCollectionView = ContrailView.extend({
        render: function () {

            var self = this,
                elementId = self.attributes.elementId,
                viewConfig = self.attributes.viewConfig,
                collectionTmpl = contrail.getTemplate4Id((viewConfig.templateId) ? viewConfig.templateId: cowc.TMPL_COLLECTION_VIEW),
                rows = viewConfig[cowc.KEY_ROWS],
                columns = null,
                path = viewConfig[cowc.KEY_PATH],
                accordionable = viewConfig['accordionable'],
                accordionConfig = contrail.checkIfExist(viewConfig.accordionable) ? viewConfig.accordionConfig : {},
                model = self.model,
                validation = (viewConfig['validation'] != null) ? viewConfig['validation'] : self.attributes.validation,
                defaultAccordionConfig  = {
                    heightStyle: "content",
                    header: ".header",
                    collapsible: true,
                    active: -1
                }, childViewObj, childElId;

            self.$el.html(collectionTmpl({elementId: elementId, viewConfig: viewConfig}));

            for (var i = 0; i < rows.length; i++) {
                columns = rows[i].columns;
                for (var j = 0; j < columns.length; j++) {
                    childViewObj = columns[j];
                    childElId = childViewObj[cowc.KEY_ELEMENT_ID];
                    self.renderView4Config(self.$el.find("#" + childElId), self.model, childViewObj, validation, false, null, function(){
                        if (accordionable) {
                            accordionConfig = $.extend(true, defaultAccordionConfig, accordionConfig);
                            self.$el.find('.collection').accordion(accordionConfig);
                        }
                    });
                }
            }
        }
    });

    return FormCollectionView;
});
/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */

define('core-basedir/js/views/FormComboboxView',[
    'underscore',
    'contrail-view'
], function (_, ContrailView) {
    var FormComboboxView = ContrailView.extend({
        render: function () {
            var self = this,
                viewConfig = self.attributes.viewConfig,
                comboboxTemplate = contrail.getTemplate4Id((viewConfig.templateId) ? viewConfig.templateId: cowc.TMPL_COMBOBOX_VIEW),
                elId = self.attributes.elementId,
                app = self.attributes.app,
                validation = self.attributes.validation,
                elementConfig = viewConfig[cowc.KEY_ELEMENT_CONFIG],
                path = viewConfig[cowc.KEY_PATH],
                lockEditingByDefault = self.attributes.lockEditingByDefault,
                label = viewConfig.label,
                labelValue = (label != null)? label :((elId != null)? cowl.get(elId, app) : cowl.get(path, app)),
                tmplParameters;

            if (!(contrail.checkIfExist(lockEditingByDefault) && lockEditingByDefault)) {
                lockEditingByDefault = false;
            }

            self.model.initLockAttr(path, lockEditingByDefault);

            tmplParameters = {
                label: labelValue, id: elId + '_combobox', name: elId, class: "span12",
                viewConfig: viewConfig, lockAttr: lockEditingByDefault, validation: validation
            };

            /* Save the elementConfig for the dropdown in elementConfigMap in the model
             'key' is the name of the element and 'value is the actual element config' */

            // get the current elementConfigMap
            var currentElementConfigMap = self.model.model().get('elementConfigMap');
            if(!contrail.checkIfExist(currentElementConfigMap)){
                currentElementConfigMap = {};
                self.model.model().set('elementConfigMap', currentElementConfigMap);
            }
            // Update the existing elementConfigMap by adding the the new element elementConfig
            // will get updated in the model also
            currentElementConfigMap[elId] = elementConfig;
            self.$el.html(comboboxTemplate(tmplParameters));
            if (contrail.checkIfFunction(elementConfig.onInit)) {
                elementConfig.onInit(self.model.model());
            }
        }
    });

    return FormComboboxView;
});
/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */

define('core-basedir/js/views/FormCompositeView',[
    'underscore',
    'contrail-view'
], function (_, ContrailView) {
    var FormCompositeView = ContrailView.extend({
        render: function () {
            var self = this,
                buttonTemplate = contrail.getTemplate4Id(cowc.TMPL_COMPOSITE_VIEW),
                viewConfig = self.attributes.viewConfig,
                elId = self.attributes.elementId,
                app = self.attributes.app,
                elementConfig = viewConfig.elementConfig,
                label = viewConfig.label,
                path = viewConfig[cowc.KEY_PATH],
                labelValue = (label != null)? label :((elId != null)? cowl.get(elId, app) : cowl.get(path, app)),
                validation = self.attributes.validation,
                lockEditingByDefault = self.attributes.lockEditingByDefault,
                modelMap = self.modelMap,
                childView = viewConfig[cowc.KEY_CHILD_VIEW],
                tmplParameters, childViewObj, childViewElId;

            tmplParameters = { label: labelValue, id: elId, name: elId, class: "span3", elementConfig: elementConfig, childView: childView };

            self.$el.html(buttonTemplate(tmplParameters));

            for (var j = 0; j < childView.length; j++) {
                childViewObj = childView[j];
                childViewElId = childViewObj[cowc.KEY_ELEMENT_ID];

                self.renderView4Config(self.$el.find("#" + childViewElId), self.model, childViewObj, validation, lockEditingByDefault, modelMap);
            }
        }
    });

    return FormCompositeView;
});

/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */

define('core-basedir/js/views/FormDateTimePickerView',[
    'underscore',
    'contrail-view'
], function (_, ContrailView) {
    var FormDateTimePickerView = ContrailView.extend({
        render: function () {
            var self = this,
                dateTimePickerTemplate = contrail.getTemplate4Id(cowc.TMPL_DATETIMEPICKER_VIEW),
                viewConfig = self.attributes.viewConfig,
                elId = self.attributes.elementId,
                app = self.attributes.app,
                validation = self.attributes.validation,
                elementConfig = viewConfig[cowc.KEY_ELEMENT_CONFIG],
                path = viewConfig[cowc.KEY_PATH],
                lockEditingByDefault = self.attributes.lockEditingByDefault,
                label = viewConfig.label,
                labelValue = (label != null)? label :((elId != null)? cowl.get(elId, app) : cowl.get(path, app)),
                tmplParameters;

            if (!(contrail.checkIfExist(lockEditingByDefault) && lockEditingByDefault)) {
                lockEditingByDefault = false;
            }
            this.model.initLockAttr(path, lockEditingByDefault);

            tmplParameters = {
                id: elId + '_datetimepicker', name: elId,
                label: labelValue, dataBindValue: viewConfig[cowc.KEY_DATABIND_VALUE],
                lockAttr: lockEditingByDefault, class: "span12",
                viewConfig: viewConfig, elementConfig: elementConfig, validation: validation
            };

            self.$el.html(dateTimePickerTemplate(tmplParameters));

            var currentElementConfigMap = this.model.model().get('elementConfigMap');
            if(!contrail.checkIfExist(currentElementConfigMap)){
                currentElementConfigMap = {};
                this.model.model().set('elementConfigMap', currentElementConfigMap);
            }

            currentElementConfigMap[elId] = elementConfig;
        }
    });

    return FormDateTimePickerView;
});
/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */

define('core-basedir/js/views/FormDropdownView',[
    'underscore',
    'contrail-view',
    'select2'
], function (_, ContrailView) {
    var FormDropdownView = ContrailView.extend({
        render: function () {
            var self = this,
                viewConfig = this.attributes.viewConfig,
                dropdownTemplate = contrail.getTemplate4Id((viewConfig.templateId) ? viewConfig.templateId: cowc.TMPL_DROPDOWN_VIEW),
                elId = self.attributes.elementId,
                app = self.attributes.app,
                validation = self.attributes.validation,
                elementConfig = viewConfig[cowc.KEY_ELEMENT_CONFIG],
                path = viewConfig[cowc.KEY_PATH],
                lockEditingByDefault = this.attributes.lockEditingByDefault,
                label = viewConfig.label,
                labelValue = (label != null)? label :((elId != null)? cowl.get(elId, app) : cowl.get(path, app)),
                tmplParameters;

            if (!(contrail.checkIfExist(lockEditingByDefault) && lockEditingByDefault)) {
                lockEditingByDefault = false;
            }
            if(this.model != null) {
                this.model.initLockAttr(path, lockEditingByDefault);
            }
            tmplParameters = {
                id: elId + '_dropdown', class: "span12", name: elId, label: labelValue,
                viewConfig: viewConfig, lockAttr: lockEditingByDefault, validation: validation
            };

            /* Save the elementConfig for the dropdown in elementConfigMap in the model
             'key' is the name of the element and 'value is the actual element config' */

            // get the current elementConfigMap
            if(this.model != null) {
                var currentElementConfigMap = this.model.model().get('elementConfigMap');
                if(!contrail.checkIfExist(currentElementConfigMap)){
                    currentElementConfigMap = {};
                    this.model.model().set('elementConfigMap', currentElementConfigMap);
                }
                // Update the existing elementConfigMap by adding the the new element elementConfig
                // will get updated in the model also
                currentElementConfigMap[elId] = elementConfig;
            }
            this.$el.html(dropdownTemplate(tmplParameters));
            if (contrail.checkIfFunction(elementConfig.onInit) && this.model != null) {
                elementConfig.onInit(this.model.model());
            }
        }
    });

    return FormDropdownView;
});

/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */

define('core-basedir/js/views/FormEditableGridView',[
    'underscore',
    'contrail-view'
], function (_, ContrailView) {
    var FormEditableGridView = ContrailView.extend({
        render: function () {
            var viewConfig = this.attributes.viewConfig,
                editableGridTmpl = contrail.getTemplate4Id((viewConfig.templateId) ? viewConfig.templateId: cowc.TMPL_EDITABLE_GRID_VIEW),
                columns = viewConfig.columns,
                path = viewConfig[cowc.KEY_PATH],
                model = this.model,
                validation = (viewConfig['validation'] != null) ? viewConfig['validation'] : this.attributes.validation,
                childViewObj, childElId;

            model.initLockAttr(path, false);

            this.$el.html(editableGridTmpl(viewConfig));

            for (var j = 0; j < columns.length; j++) {
                childViewObj = columns[j];
                childElId = childViewObj[cowc.KEY_ELEMENT_ID];
                this.renderView4Config(this.$el.find("#" + childElId), this.model, childViewObj, validation, false);
            }
        }
    });

    return FormEditableGridView;
});
/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */

define('core-basedir/js/views/FormGridView',[
    'underscore',
    'contrail-view'
], function (_, ContrailView) {
    //TODO: Make it generic for any kind of form edit.
    var FormGridView = ContrailView.extend({
        render: function () {
            var viewConfig = this.attributes.viewConfig,
                model = this.model,
                elId = this.attributes.elementId;

            var defaultFormGridConfig = {
                header: {
                    defaultControls: {
                        exportable: false,
                        refreshable: true,
                        searchable: true
                    }
                },
                body: {
                    options: {
                        checkboxSelectable: true,
                        detail: false
                    }
                },
                footer: {
                    pager: {
                        options: {
                            pageSize: 5,
                            pageSizeSelect: [5, 10, 50]
                        }

                    }
                }
            };

            var gridConfig = $.extend(true, {}, defaultFormGridConfig, viewConfig.elementConfig);

            cowu.renderGrid(this.$el, gridConfig);
        }
    });

    return FormGridView;
});
/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */

define('core-basedir/js/views/FormHierarchicalDropdownView',[
    'underscore',
    'contrail-view'
], function (_, ContrailView) {
    var self;
    var FormHierarchicalDropdownView = ContrailView.extend({
        render: function () {
            self = this;
            var viewConfig = this.attributes.viewConfig,
                dropdownTemplate =
                    contrail.getTemplate4Id((viewConfig.templateId) ?
                    viewConfig.templateId: cowc.TMPL_DROPDOWN_VIEW),
                label = this.attributes.label,
                elId = this.attributes.elementId,
                app = this.attributes.app,
                validation = this.attributes.validation,
                visible =  this.attributes.visible,
                path = viewConfig[cowc.KEY_PATH],
                lockEditingByDefault = this.attributes.lockEditingByDefault,
                labelValue = (label != null)? label :((elId != null) ?
                    cowl.get(elId, app) : cowl.get(path, app)),
                tmplParameters;
                self.elementConfig = viewConfig[cowc.KEY_ELEMENT_CONFIG];
                /*Merge hierarchical opts with defaults*/
                 $.extend(self.elementConfig, self.hierarchicalOptions());
            if (!(contrail.checkIfExist(lockEditingByDefault) &&
                lockEditingByDefault)) {
                lockEditingByDefault = false;
            }
            this.model.initLockAttr(path, lockEditingByDefault);

            tmplParameters = {
                label: labelValue, id: elId + '_dropdown', name: elId,
                viewConfig: viewConfig,
                lockAttr: lockEditingByDefault,
                class: "span12",
                validation: validation
            };

            /* Save the elementConfig for the dropdown in elementConfigMap in
               the model 'key' is the name of the element and 'value is
               the actual element config' */

            // get the current elementConfigMap
            var currentElementConfigMap =
                this.model.model().get('elementConfigMap');
            if(!contrail.checkIfExist(currentElementConfigMap)){
                currentElementConfigMap = {};
                this.model.model().set('elementConfigMap',
                    currentElementConfigMap);
            }
            /* Update the existing elementConfigMap by adding the the new
                element elementConfig will get updated in the model also*/
            currentElementConfigMap[elId] = self.elementConfig;

            this.$el.html(dropdownTemplate(tmplParameters));
            this.$el.find('#' + elId + '_dropdown').data("elementConfig",
                self.elementConfig);
            if (contrail.checkIfFunction(self.elementConfig.onInit)) {
                self.elementConfig.onInit(this.model.model());
            }
        },
        hierarchicalOptions : function() {
            var opts = {};
            opts.query = self.select2Query;
            opts.formatResult = self.select2ResultFormat;
            opts.formatSelection = self.select2Format;
            opts.selectOnBlur =  true;
            opts.close = self.loadSelect2CloseActions;
            opts.open = self.loadSelect2OpenActions;
            return opts;
        },
        loadSelect2CloseActions : function() {
            var map = self.elementConfig.queryMap;
            //show inbuilt select2 search results for custom term
            $('.select2-results >\
            .select2-results-dept-0.select2-result-selectable').
            attr('style','display:block');
            if($(".select2-search") &&  $(".select2-search").length > 0) {
                self.setSelectedGroupIcon(map[0].name);
            }
            $('.select2-results').removeAttr('style');
            $('.res-icon').remove();
        },
        loadSelect2OpenActions : function() {
            var map = self.elementConfig.queryMap;
            $('.select2-results').attr('style','max-height:400px;');
            $('.res-icon').remove();
            $(".select2-search").
                prepend('<i class="'+ map[0].iconClass +' res-icon"> </i>');
        },
        select2Format : function(state) {
            var originalOption = state.element != null ? state.element : state;
            var fomattedTxt = state.text;
            if(state.parent != undefined){
                fomattedTxt = self.choiceSelection(state);
            }
            return "<div style='text-overflow:ellipsis;overflow:hidden;'\
                title ='" + state.text + "'>" + fomattedTxt + "</div>";
        },
        choiceSelection : function(state){
            var map = self.elementConfig.queryMap;
            var fomattedTxt;
            var txt = state.parent != undefined ? state.parent :
                self.getValueFromMap(state.text)
            for(var i=0; i < map.length; i++) {
                if(txt === map[i].value) {
                    fomattedTxt = '<i class="' + map[i].iconClass + '"></i>' +
                        ' ' + state.text;
                    break;
                }
            }
            return fomattedTxt;
        },
        getValueFromMap : function(txt) {
            var map = self.elementConfig.queryMap;
            var value = map[0].value;
            for(var i = 0; i < map.length; i++) {
                if(map[i].name === txt){
                    value = map[i].value;
                    break;
                }
            }
            return value;
        },
        select2ResultFormat : function(state){
            var originalOption = state.element != null ? state.element : state;
            var fomattedTxt = state.text;
            if(state.id == undefined){
                fomattedTxt = self.choiceSelection(state);
            }
            return fomattedTxt;
        },
        getSelectedGroupName : function(selector) {
            var map = self.elementConfig.queryMap;
            var grpName = map[0].name;
            var element = selector ? selector : $(".res-icon");
            for(var i = 0; i < map.length; i++) {
                 if(element.hasClass(map[i].iconClass)){
                     grpName = map[i].name;
                     break;
                 }
            }
            return grpName;
        },
        addNewTermDataSource : function(grpName, term, data) {
            var map = self.elementConfig.queryMap;
            var grpValue;
            for(var i = 0; i < map.length; i++) {
                if(map[i].name === grpName) {
                    grpValue = map[i].value;
                    break;
                }
            }
            var newItem = {
                id : term + '~' + grpValue,
                value : term + '~' + grpValue,
                text : term,
                parent : grpValue
            };
            for(var i = 0; i < data.length ; i++) {
                if(data[i].text === grpName &&  data[i].children.length === 1) {
                    data[i].children.push(newItem);
                    break;
                }
            }
        },
        setSelectedGroupIcon : function(grpName){
            var map = self.elementConfig.queryMap;
            var currentIcon = map[0].iconClass;
            for(var i=0; i < map.length; i++) {
                if(grpName === map[i].name) {
                    currentIcon = map[i].iconClass;
                    break;
                }
            }
            $(".res-icon").remove();
            $(".select2-search").prepend('<i class="'+
                currentIcon +' res-icon"> </i>');
        },
        retainExpandedGroup : function() {
            var map = self.elementConfig.queryMap;
            var subEleArry = $(".select2-result-sub");
            if(subEleArry && subEleArry.length > 0) {
                subEleArry.addClass('hide');
                var grpName = self.getSelectedGroupName();
                for(var i = 0; i < map.length; i++) {
                   if(map[i].name === grpName) {
                       var subEle = $(subEleArry[i]);
                       subEle.removeClass('hide');
                       break;
                   }
                }
            }
        },
        select2Query : function(query) {
            //using predefined process method to make work select2 selection
            var t = query.term,filtered = { results: [] }, process;
            var data = {results: []};
            var grpName = self.getSelectedGroupName();

            if(query.term != undefined) {
                var filteredResults = [];
                for(var i = 0; i < this.data.length;i++) {
                    var children = this.data[i]['children'];
                    filteredResults[i] = {
                        text: this.data[i]['text'],
                        children: []
                    };
                    for(var j = 0; j < children.length; j++) {
                        if(children[j].text.indexOf(query.term) != -1 ||
                            children[j].disabled == true) {
                            filteredResults[i].children.push(
                                this.data[i].children[j]);
                        }
                    }
                    data.results.push(filteredResults[i]);
                }
                if(query.term != '') {
                    self.addNewTermDataSource(grpName, query.term,
                        data.results);
                }
                var pageSize = 200;
                for(var i=1 ; i < data.results.length ; i++){
                    var more = false;
                    if (data.results[i]['children'].length >=
                        query.page*pageSize) {
                        more = true;
                    }
                    data.results[i]['children'] =
                        data.results[i]['children'].
                        slice((query.page-1) * pageSize,query.page * pageSize);
                    if (more) {
                        data.results[i]['children'].push({id:"search" + i,
                        text:"Search to find more entries", disabled : true});
                    }
                }
            } else {
                process = function(datum, collection) {
                    var group, attr;
                    datum = datum[0];
                    if (datum.children) {
                        group = {};
                        for (attr in datum) {
                            if (datum.hasOwnProperty(attr)){
                                group[attr]=datum[attr];
                            }
                        }
                        group.children=[];
                        $(datum.children).each2(
                            function(i, childDatum) {
                                process(childDatum, group.children);
                            }
                        );
                        if (group.children.length ||
                            query.matcher(t, '', datum)) {
                            collection.push(group);
                        }
                    } else {
                        if (query.matcher(t, '', datum)) {
                            collection.push(datum);
                        }
                    }
                };
                if(t != ""){
                    $(this.data).each2(
                        function(i, datum) {
                            process(datum, filtered.results);
                        }
                    )
                }
                data.results = this.data;
            }
            query.callback(data);

            //hide inbuilt select2 search results for custom term
            $('.select2-results >\
            .select2-results-dept-0.select2-result-selectable').
            attr('style','display:none');

            var subEleArry = $(".select2-result-sub");
            if(subEleArry && subEleArry.length > 0) {
               for(var i = 0; i < subEleArry.length; i++) {
                    $(subEleArry[i]).attr('style',
                        'max-height:150px;overflow:auto;');
               }
            }
            self.retainExpandedGroup();

            if($(".select2-result-label") &&
                $(".select2-result-label").length > 0) {
                //set background color for groups
                for(var i = 0; i < $(".select2-result-label").length; i++) {
                    if($($('.select2-result-label')[i]).find('i') &&
                        $($('.select2-result-label')[i]).find('i').length > 0) {
                        $($('.select2-result-label')[i]).
                        attr('style','background-color:#E2E2E2;margin-top:2px;')
                        $($('.select2-result-label')[i]).
                        attr('style','background-color:#E2E2E2;margin-top:2px;')
                    }
                }
                $(".select2-result-label").on('click', function() {
                    if($(this).parent().hasClass('select2-disabled')) {
                        return;
                    }
                    $('.select2-result-sub').addClass('hide');
                    $(this).parent().find('.select2-result-sub').
                        removeClass('hide');

                    $(".res-icon").remove();
                    self.setSelectedGroupIcon(this.textContent.trim());
                });
            }
            if($(".select2-search") &&  $(".select2-search").length > 0) {
                var grpName = self.getSelectedGroupName();
                self.setSelectedGroupIcon(grpName);
            }
        }
    });

    return FormHierarchicalDropdownView;
});


/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */

define('core-basedir/js/views/FormInputView',[
    'underscore',
    'contrail-view'
], function (_, ContrailView) {
    var FormInputView = ContrailView.extend({
        render: function () {
            var self = this,
                viewConfig = self.attributes.viewConfig,
                inputTemplate = contrail.getTemplate4Id((viewConfig.templateId) ? viewConfig.templateId: cowc.TMPL_INPUT_VIEW),
                elId = self.attributes.elementId,
                app = self.attributes.app,
                validation = self.attributes.validation,
                path = viewConfig[cowc.KEY_PATH],
                type = (viewConfig[cowc.KEY_TYPE] != null) ? viewConfig[cowc.KEY_TYPE] : 'text',
                lockEditingByDefault = self.attributes.lockEditingByDefault,
                label = viewConfig.label,
                labelValue = (label != null)? label :((elId != null)? cowl.get(elId, app) : cowl.get(path, app)),
                tmplParameters,
                onBlur = viewConfig.onBlur;

            if (!(contrail.checkIfExist(lockEditingByDefault) && lockEditingByDefault)) {
                lockEditingByDefault = false;
            }

            self.model.initLockAttr(path, lockEditingByDefault);

            tmplParameters = {
                id: elId, name: elId, type: type, class: "span12",
                label: labelValue, viewConfig: viewConfig,
                lockAttr: lockEditingByDefault, validation: validation
            };

            self.$el.html(inputTemplate(tmplParameters));
            if (onBlur) {
                self.$el.find('input').blur(onBlur);
            }
        }
    });

    return FormInputView;
});

/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */

define('core-basedir/js/views/FormMultiselectView',[
    'underscore',
    'contrail-view',
    'select2'
], function (_, ContrailView) {
    var FormMultiselectView = ContrailView.extend({
        render: function () {
            var self = this,
                viewConfig = self.attributes.viewConfig,
                msTemplate = contrail.getTemplate4Id((viewConfig.templateId) ? viewConfig.templateId: cowc.TMPL_MULTISELECT_VIEW),
                label = viewConfig.label,
                elId = self.attributes.elementId,
                app = self.attributes.app,
                validation = self.attributes.validation,
                elementConfig = viewConfig[cowc.KEY_ELEMENT_CONFIG],
                path = viewConfig[cowc.KEY_PATH],
                lockEditingByDefault = self.attributes.lockEditingByDefault,
                labelValue = (label != null)? label :((elId != null) ? cowl.get(elId, app) : cowl.get(path, app)),
                tmplParameters;

            if (!(contrail.checkIfExist(lockEditingByDefault) && lockEditingByDefault)) {
                lockEditingByDefault = false;
            }
            self.model.initLockAttr(path, lockEditingByDefault);

            tmplParameters = {
                label: labelValue, id: elId + '_dropdown', name: elId, class: "span12",
                viewConfig: viewConfig, lockAttr: lockEditingByDefault, validation: validation
            };

            /* Save the elementConfig for the dropdown in elementConfigMap in the model
             'key' is the name of the element and 'value is the actual element config' */

            // get the current elementConfigMap
            var currentElementConfigMap = self.model.model().get('elementConfigMap');
            if(!contrail.checkIfExist(currentElementConfigMap)){
                currentElementConfigMap = {};
                self.model.model().set('elementConfigMap', currentElementConfigMap);
            }
            // Update the existing elementConfigMap by adding the the new element elementConfig
            // will get updated in the model also
            currentElementConfigMap[elId] = elementConfig;
            self.$el.html(msTemplate(tmplParameters));
            if (contrail.checkIfFunction(elementConfig.onInit)) {
                elementConfig.onInit(self.model.model());
            }

        }
    });

    return FormMultiselectView;
});

/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */

define('core-basedir/js/views/FormNumericTextboxView',[
    'underscore',
    'contrail-view'
], function (_, ContrailView) {
    var FormNumericTextboxView = ContrailView.extend({
        render: function () {
            var self = this,
                numericTextboxTemplate = contrail.getTemplate4Id(cowc.TMPL_NUMERICTEXTBOX_VIEW),
                viewConfig = self.attributes.viewConfig,
                elId = self.attributes.elementId,
                app = self.attributes.app,
                elementConfig = viewConfig[cowc.KEY_ELEMENT_CONFIG],
                path = viewConfig[cowc.KEY_PATH],
                lockEditingByDefault = self.attributes.lockEditingByDefault,
                label = viewConfig.label,
                labelValue = (label != null)? label :((elId != null)? cowl.get(elId, app) : cowl.get(path, app)),
                tmplParameters;

            if (!(contrail.checkIfExist(lockEditingByDefault) && lockEditingByDefault)) {
                lockEditingByDefault = false;
            }
            this.model.initLockAttr(path, lockEditingByDefault);

            tmplParameters = {
                label: labelValue, id: elId + '_numerictextbox', name: elId, dataBindValue: viewConfig[cowc.KEY_DATABIND_VALUE],
                lockAttr: lockEditingByDefault, class: "span12", elementConfig: elementConfig
            };

            self.$el.html(numericTextboxTemplate(tmplParameters));

            var currentElementConfigMap = this.model.model().get('elementConfigMap');
            if(!contrail.checkIfExist(currentElementConfigMap)){
                currentElementConfigMap = {};
                this.model.model().set('elementConfigMap', currentElementConfigMap);
            }

            currentElementConfigMap[elId] = elementConfig;
        }
    });

    return FormNumericTextboxView;
});
/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */

define('core-basedir/js/views/FormRadioButtonView',[
    'underscore',
    'contrail-view'
], function (_, ContrailView) {
    var FormRadioButtonView = ContrailView.extend({
        render: function () {
            var radioButtonTemplate = contrail.getTemplate4Id(cowc.TMPL_RADIO_BUTTON_VIEW),
                viewConfig = this.attributes.viewConfig,
                elementConfig = viewConfig[cowc.KEY_ELEMENT_CONFIG],
                elId = this.attributes.elementId,
                app = this.attributes.app,
                validation = this.attributes.validation,
                path = viewConfig['path'],
                type = (viewConfig['type'] != null) ? viewConfig['type'] : 'radio',
                lockEditingByDefault = this.attributes.lockEditingByDefault,
                labelValue = (elId != null) ? cowl.get(elId, app) : cowl.get(path, app),
                tmplParameters;

            if (!(contrail.checkIfExist(lockEditingByDefault) && lockEditingByDefault)) {
                lockEditingByDefault = false;
            }
            if(this.model != null) {
                this.model.initLockAttr(path, lockEditingByDefault);
            }
            tmplParameters = {
                label: labelValue, id: elId, name: elId,
                dataBindValue: viewConfig['dataBindValue'],
                lockAttr: lockEditingByDefault,
                isChecked: viewConfig['dataBindValue'],
                path: path, validation: validation,
                elementConfig: elementConfig
            };
            this.$el.html(radioButtonTemplate(tmplParameters));
        }
    });

    return FormRadioButtonView;
});
/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */

define('core-basedir/js/views/FormTextAreaView',[
    'underscore',
    'contrail-view'
], function (_, ContrailView) {
    var FormTextAreaView = ContrailView.extend({
        render: function () {
            var self = this,
                viewConfig = self.attributes.viewConfig,
                textAreaTemplate = contrail.getTemplate4Id((viewConfig.templateId) ? viewConfig.templateId: cowc.TMPL_TEXTAREA_VIEW),
                elId = self.attributes.elementId,
                app = self.attributes.app,
                validation = self.attributes.validation,
                path = viewConfig[cowc.KEY_PATH],
                placeHolder = contrail.checkIfExist(viewConfig['placeHolder']) ? viewConfig['placeHolder'] : null,
                type = (viewConfig[cowc.KEY_TYPE] != null) ? viewConfig[cowc.KEY_TYPE] : 'text',
                lockEditingByDefault = self.attributes.lockEditingByDefault,
                label = viewConfig.label,
                labelValue = (label != null)? label :((elId != null)? cowl.get(elId, app) : cowl.get(path, app)),
                showEditIcon = contrail.checkIfExist(viewConfig['editPopupConfig']) ? true : false,
                tmplParameters;

            if (!(contrail.checkIfExist(lockEditingByDefault) && lockEditingByDefault)) {
                lockEditingByDefault = false;
            }
            self.model.initLockAttr(path, lockEditingByDefault);

            tmplParameters = {
                label: labelValue, id: elId, name: elId, placeHolder: placeHolder, viewConfig: viewConfig,
                dataBindValue: viewConfig[cowc.KEY_DATABIND_VALUE], lockAttr: lockEditingByDefault, type: type,
                class: "span12", path: path, validation: validation, showEditIcon: showEditIcon
            };

            self.$el.html(textAreaTemplate(tmplParameters));

            if(showEditIcon) {
                self.$el.find(".add-on").on("click", function(event) {
                    if (!$(this).hasClass('disabled')) {
                        viewConfig['editPopupConfig'].renderEditFn(event)
                    }
                });
            }

            self.$el.find('textarea')
                .off('input')
                .on('input', function() {
                    $(this).height(0).height($(this).get(0).scrollHeight - 5);
                });
        }
    });

    return FormTextAreaView;
});

/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */

define('core-basedir/js/views/FormTextView',[
    'underscore',
    'contrail-view'
], function (_, ContrailView) {
    var FormTextView = ContrailView.extend({
        render: function () {
            var self = this,
                viewConfig = self.attributes.viewConfig,
                cssClass = self.attributes.class,
                textTemplate = contrail.getTemplate4Id((viewConfig.templateId) ? viewConfig.templateId: cowc.TMPL_TEXT_VIEW),
                tmplParameters;

            tmplParameters = {
                class: cssClass, viewConfig: viewConfig
            };

            self.$el.html(textTemplate(tmplParameters));
        }
    });

    return FormTextView;
});

/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */

define('core-basedir/js/views/HeatChartView',[
    'underscore',
    'contrail-view',
], function (_, ContrailView) {
    var HeatChartView = ContrailView.extend({
        render: function () {
            var loadingSpinnerTemplate = contrail.getTemplate4Id(cowc.TMPL_LOADING_SPINNER),
                heatChartTemplate = contrail.getTemplate4Id(ctwc.TMPL_VN_PORT_HEAT_CHART),
                viewConfig = this.attributes.viewConfig,
                ajaxConfig = viewConfig['ajaxConfig'],
                chartOptions = viewConfig['chartOptions'],
                self = this, deferredObj = $.Deferred();

            self.$el.append(loadingSpinnerTemplate);

            var selector = $(self.$el);

            $.ajax(ajaxConfig).done(function (result) {
                deferredObj.resolve(result);
            });

            deferredObj.done(function (response) {
                selector.html(heatChartTemplate());

                renderHeatChartCB(selector.find("#src-udp-heat-chart"), ctwp.parseNetworks4PortMap({
                    res: jsonPath(response, '$..udp_sport_bitmap')[0],
                    type: 'src',
                    pType: 'udp'
                }), chartOptions);
                renderHeatChartCB(selector.find("#dst-udp-heat-chart"), ctwp.parseNetworks4PortMap({
                    res: jsonPath(response, '$..udp_dport_bitmap')[0],
                    type: 'dst',
                    pType: 'udp'
                }), chartOptions);
                renderHeatChartCB(selector.find("#src-tcp-heat-chart"), ctwp.parseNetworks4PortMap({
                    res: jsonPath(response, '$..tcp_sport_bitmap')[0],
                    type: 'src',
                    pType: 'tcp'
                }), chartOptions);
                renderHeatChartCB(selector.find("#dst-tcp-heat-chart"), ctwp.parseNetworks4PortMap({
                    res: jsonPath(response, '$..tcp_dport_bitmap')[0],
                    type: 'dst',
                    pType: 'tcp'
                }), chartOptions);
            });

            deferredObj.fail(function (errObject) {
                if (errObject['errTxt'] != null && errObject['errTxt'] != 'abort') {
                    showMessageInChart({
                        selector: self.$el,
                        msg: 'Error in fetching Details'
                    });
                }
            });

        }
    });

    function renderHeatChartCB(selector, response, chartOptions) {
        var data = response['res'];
        var margin = {top: 20, right: 0, bottom: 100, left: 20},
            width = 960 - margin.left - margin.right,
            height = 230 - margin.top - margin.bottom,
            gridSize = Math.floor(width / 64),
            legendElementWidth = gridSize * 2,
            buckets = 9,
            colors = ["#ffffd9", "#edf8b1", "#c7e9b4", "#7fcdbb", "#41b6c4", "#1d91c0", "#225ea8", "#253494", "#081d58"], // alternatively colorbrewer.YlGnBu[9]
            colors = ["white", "#599AC9"]; // alternatively colorbrewer.YlGnBu[9]
        var maxValue = d3.max(data, function (d) {
            return d.value;
        });
        if (maxValue == 0)
            colors = ['white'];
        var colorScale = d3.scale.quantile()
            .domain([0, buckets - 1, maxValue])
            .range(colors);

        var svg = d3.select($(selector)[0]).append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var xValues = [], yValues = [];
        for (var i = 0; i < 64; i++) {
            xValues.push(i);
        }
        for (var i = 0; i < 4; i++) {
            yValues.push(i);
        }
        var yLabels = svg.selectAll(".xLabel")
            .data(yValues)
            .enter().append("text")
            //.text(function (d) { return d; })
            .attr("x", 0)
            .attr("y", function (d, i) {
                return i * gridSize;
            })
            .style("text-anchor", "end")
            .attr("transform", "translate(-6," + gridSize / 1.5 + ")")
            .attr("class", function (d, i) {
                return ((i >= 0 && i <= 4) ? "xLabel mono axis axis-workweek" : "xLabel mono axis");
            });

        var xLabels = svg.selectAll(".xLabel")
            .data(xValues)
            .enter().append("text")
            //.text(function(d) { return d; })
            .attr("x", function (d, i) {
                return i * gridSize;
            })
            .attr("y", 0)
            .style("text-anchor", "middle")
            .attr("transform", "translate(" + gridSize / 2 + ", -6)")
            .attr("class", function (d, i) {
                return ((i >= 7 && i <= 16) ? "xLabel mono axis axis-worktime" : "xLabel mono axis");
            });

        var heatMap = svg.selectAll(".hour")
            .data(data)
            .enter().append("rect")
            .attr("x", function (d) {
                return (d.x - 1) * gridSize;
            })
            .attr("y", function (d) {
                return (d.y - 1) * gridSize;
            })
            //.attr("rx", 4)
            //.attr("ry", 4)
            .attr("class", "hour bordered")
            .attr("width", gridSize)
            .attr("height", gridSize)
            .style("fill", colors[0]);
        heatMap.transition().duration(1000)
            .style("fill", function (d) {
                return colorScale(d.value);
            });
        heatMap.on('click', chartOptions.getClickFn(selector, response));
        heatMap.on('mouseover', function () {
            d3.select(this).style('cursor', 'pointer');
        });
        heatMap.append("title").text(function (d) {
            var startRange = ((64 * d.y) + d.x) * 256;
            //return 'Hello' + d.value;
            return startRange + ' - ' + (startRange + 255);
        });

        var legend = svg.selectAll(".legend")
            .data([0].concat(colorScale.quantiles()), function (d) {
                return d;
            })
            .enter().append("g")
            .attr("class", "legend");
    };

    return HeatChartView;
});
/*
 * Copyright (c) 2015 Juniper Networks, Inc. All rights reserved.
 */

define('core-basedir/js/models/HorizontalBarChartModel',[
    'underscore'
], function (_) {
    /**
     * This chart model accepts data in following format:
     *  [{key: '', values: [{label: '', value: },{..}]},{..}]
     * @param chartOptions
     * @returns multiBarHorizontalChartModel
     */
    var HorizontalBarChartModel = function (chartOptions) {
        var chartModel = nv.models.multiBarHorizontalChart()
            .height(chartOptions.height)
            .margin(chartOptions.margin)
            .x(function (d) {
                return d.label;
            })
            .y(function (d) {
                return d.value;
            })
            .showLegend(chartOptions.showLegend)
            .showValues(chartOptions.showValues)
            .stacked(chartOptions.stacked)
            .showControls(chartOptions.showControls)
            .tooltips(chartOptions.showTooltips)
            .color(function (d) {
                return chartOptions.barColor(d.key);
            });

        chartModel.xAxis.axisLabel(chartOptions.xAxisLabel);
        chartModel.xAxis.tickPadding(chartOptions.xAxisTickPadding);
        chartModel.yAxis.axisLabel(chartOptions.yAxisLabel).tickFormat(chartOptions.yFormatter);
        chartModel.yAxis.tickPadding(chartOptions.yAxisTickPadding);

        return chartModel;
    }
    return HorizontalBarChartModel;
});
/*
 * Copyright (c) 2015 Juniper Networks, Inc. All rights reserved.
 */

define('core-basedir/js/views/HorizontalBarChartView',[
    'underscore',
    'contrail-view',
    'core-basedir/js/models/HorizontalBarChartModel',
    'contrail-list-model'
], function (_, ContrailView, HorizontalBarChartModel, ContrailListModel) {
    var HorizontalBarChartView = ContrailView.extend({
        render: function () {
            var loadingSpinnerTemplate = contrail.getTemplate4Id(cowc.TMPL_LOADING_SPINNER),
                viewConfig = this.attributes.viewConfig,
                ajaxConfig = viewConfig['ajaxConfig'],
                self = this,
                selector = $(self.$el);

            $(selector).append(loadingSpinnerTemplate);

            if (viewConfig['modelConfig'] != null) {
                self.model = new ContrailListModel(viewConfig['modelConfig']);
                if (self.model.loadedFromCache || !(self.model.isRequestInProgress())) {
                    var chartData = self.model.getItems();
                    self.renderChart(selector, viewConfig, chartData);
                }

                self.model.onAllRequestsComplete.subscribe(function () {
                    var chartData = self.model.getItems();
                    self.renderChart(selector, viewConfig, chartData);
                });

                if (viewConfig.loadChartInChunks) {
                    self.model.onDataUpdate.subscribe(function () {
                        var chartData = self.model.getItems();
                        self.renderChart(selector, viewConfig, chartData);
                    });
                }
            }
        },

        renderChart: function (selector, viewConfig, data) {
            var chartViewConfig, chartModel, chartData, chartOptions;

            if (contrail.checkIfFunction(viewConfig['parseFn'])) {
                data = viewConfig['parseFn'](data);
            }

            chartOptions = ifNull(viewConfig['chartOptions'], {});

            chartViewConfig = getChartViewConfig(data, chartOptions);
            chartData = chartViewConfig['chartData'];
            chartOptions = chartViewConfig['chartOptions'];

            chartModel = new HorizontalBarChartModel(chartOptions);
            this.chartModel = chartModel;

            if ($(selector).find("svg") != null) {
                $(selector).empty();
            }

            $(selector).append("<svg style='height:" + chartOptions.height + "px;'></svg>");

            //Store the chart object as a data attribute so that the chart can be updated dynamically
            $(selector).data('chart', chartModel);

            if (!($(selector).is(':visible'))) {
                $(selector).find('svg').bind("refresh", function () {
                    d3.select($(selector)[0]).select('svg').datum(chartData).call(chartModel);
                });
            } else {
                d3.select($(selector)[0]).select('svg').datum(chartData).call(chartModel);
            }

            nv.utils.windowResize(function () {
                chUtils.updateChartOnResize(selector, chartModel);
            });

            if (chartOptions['deferredObj'] != null)
                chartOptions['deferredObj'].resolve();

            $(selector).find('.loading-spinner').remove();
        }
    });

    function getChartViewConfig(chartData, chartOptions) {
        var chartViewConfig = {};
        var chartDefaultOptions = {
            margin: {top: 10, right: 30, bottom: 20, left: 60},
            height: 100,
            xAxisLabel: 'Items',
            //xFormatter: '', // NOT supported
            xAxisTickPadding: 10,
            yAxisLabel: 'Values',
            yAxisTickPadding: 5,
            yFormatter: function (d) {
                return cowu.addUnits2Bytes(d, false, false, 2);
            },
            showLegend: false,
            showValues: false,
            stacked: false,
            showControls: false,
            showTooltips: true,
            barColor: d3.scale.category10()
        };
        var chartOptions = $.extend(true, {}, chartDefaultOptions, chartOptions);

        chartViewConfig['chartData'] = chartData;
        chartViewConfig['chartOptions'] = chartOptions;

        return chartViewConfig;
    };

    return HorizontalBarChartView;
});
/*
 ##Juniper License

 Copyright (c) 2014 Juniper Networks, Inc.

 ##nvd3.js License

 Copyright (c) 2011-2014 [Novus Partners, Inc.][novus]

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.

 [novus]: https://www.novus.com/

 ##d3.js License

 Copyright (c) 2012, Michael Bostock
 All rights reserved.

 Redistribution and use in source and binary forms, with or without
 modification, are permitted provided that the following conditions are met:

 * Redistributions of source code must retain the above copyright notice, this
 list of conditions and the following disclaimer.

 * Redistributions in binary form must reproduce the above copyright notice,
 this list of conditions and the following disclaimer in the documentation
 and/or other materials provided with the distribution.

 * The name Michael Bostock may not be used to endorse or promote products
 derived from this software without specific prior written permission.

 THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 DISCLAIMED. IN NO EVENT SHALL MICHAEL BOSTOCK BE LIABLE FOR ANY DIRECT,
 INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
 BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
 EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

define('core-basedir/js/models/LineBarWithFocusChartModel',[
    'underscore'
], function (_) {
    var LineBarWithFocusChartModel = function(chartOptions) {
        "use strict";

        //============================================================
        // Public Variables with Default Settings
        //------------------------------------------------------------

        var lines = nv.models.line()
            , lines2 = nv.models.line()
            , bars = nv.models.multiBar()
            , bars2 = nv.models.multiBar()
            , xAxis = nv.models.axis()
            , x2Axis = nv.models.axis()
            , y1Axis = nv.models.axis()
            , y2Axis = nv.models.axis()
            , y3Axis = nv.models.axis()
            , y4Axis = nv.models.axis()
            , legend = nv.models.legend()
            , brush = d3.svg.brush()
            , tooltip = nv.models.tooltip()
            ;

        var margin = chartOptions.margin
            , margin2 = chartOptions.margin2
            , width = null
            , height = null
            , getX = function(d) { return d.x }
            , getY = function(d) { return d.y }
            , color = nv.utils.defaultColor()
            , showLegend = true
            , focusEnable = true
            , focusShowAxisY = false
            , focusShowAxisX = true
            , focusHeight = 90
            , extent
            , brushExtent = null
            , x
            , x2
            , y1
            , y2
            , y3
            , y4
            , noData = null
            , dispatch = d3.dispatch('brush', 'stateChange', 'changeState')
            , transitionDuration = 0
            , state = nv.utils.state()
            , defaultState = null
            , legendLeftAxisHint = ' (left axis)'
            , legendRightAxisHint = ' (right axis)'
            ;

        lines.clipEdge(true);
        lines2.interactive(false);
        xAxis.orient('bottom').tickPadding(5);
        y1Axis.orient('left');
        y2Axis.orient('right');
        x2Axis.orient('bottom').tickPadding(5);
        y3Axis.orient('left');
        y4Axis.orient('right');

        tooltip.headerEnabled(true).headerFormatter(function(d, i) {
            return xAxis.tickFormat()(d, i);
        });

        //============================================================
        // Private Variables
        //------------------------------------------------------------

        var stateGetter = function(data) {
            return function(){
                return {
                    active: data.map(function(d) { return !d.disabled })
                };
            }
        };

        var stateSetter = function(data) {
            return function(state) {
                if (state.active !== undefined)
                    data.forEach(function(series,i) {
                        series.disabled = !state.active[i];
                    });
            }
        };

        function chartModel(selection) {
            selection.each(function (chartDataObj) {
                var container = d3.select(this),
                    that = this,
                    data = chartDataObj.data,
                    requestState = chartDataObj.requestState;

                nv.utils.initSVG(container);
                var availableWidth = nv.utils.availableWidth(width, container, margin),
                    availableHeight1 = nv.utils.availableHeight(height, container, margin)
                        - (focusEnable ? focusHeight : 0),
                    availableHeight2 = focusHeight - margin2.top - margin2.bottom;

                chartModel.update = function () {
                    container.transition().duration(transitionDuration).call(chartModel);
                };
                chartModel.container = this;

                state
                    .setter(stateSetter(data), chartModel.update)
                    .getter(stateGetter(data))
                    .update();

                // DEPRECATED set state.disableddisabled
                state.disabled = data.map(function (d) {
                    return !!d.disabled
                });

                if (!defaultState) {
                    var key;
                    defaultState = {};
                    for (key in state) {
                        if (state[key] instanceof Array)
                            defaultState[key] = state[key].slice(0);
                        else
                            defaultState[key] = state[key];
                    }
                }

                var dataBars = [], dataLines = [],
                    series1 = [], series2 = [];

                dataBars = data.filter(function (d) {
                    return !d.disabled && d.bar
                });
                dataLines = data.filter(function (d) {
                    return !d.bar
                }); // removed the !d.disabled clause here to fix Issue #240

                series1 = data
                    .filter(function (d) {
                        return !d.disabled && d.bar
                    })
                    .map(function (d) {
                        return d.values.map(function (d, i) {
                            return {x: getX(d, i), y: getY(d, i)}
                        })
                    });

                series2 = data
                    .filter(function (d) {
                        return !d.disabled && !d.bar
                    })
                    .map(function (d) {
                        return d.values.map(function (d, i) {
                            return {x: getX(d, i), y: getY(d, i)}
                        })
                    });

                x = bars.xScale();
                x2 = x2Axis.scale();
                y1 = bars.yScale();
                y2 = lines.yScale();
                y3 = bars2.yScale();
                y4 = lines2.yScale();


                x.range([0, availableWidth]);

                x2  .domain(d3.extent(d3.merge(series1.concat(series2)), function(d) { return d.x } ))
                    .range([0, availableWidth]);

                // Setup containers and skeleton of chart
                var wrap = container.selectAll('g.nv-wrap.nv-linePlusBar').data([data]);
                var gEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap nv-linePlusBar').append('g');
                var g = wrap.select('g');

                gEnter.append('g').attr('class', 'nv-legendWrap');

                // this is the main chart
                var focusEnter = gEnter.append('g').attr('class', 'nv-focus');
                focusEnter.append('g').attr('class', 'nv-x nv-axis');
                focusEnter.append('g').attr('class', 'nv-y1 nv-axis');
                focusEnter.append('g').attr('class', 'nv-y2 nv-axis');
                focusEnter.append('g').attr('class', 'nv-barsWrap');
                focusEnter.append('g').attr('class', 'nv-linesWrap');

                // context chart is where you can focus in
                var contextEnter = gEnter.append('g').attr('class', 'nv-context');
                contextEnter.append('g').attr('class', 'nv-x nv-axis');
                contextEnter.append('g').attr('class', 'nv-y1 nv-axis');
                contextEnter.append('g').attr('class', 'nv-y2 nv-axis');
                contextEnter.append('g').attr('class', 'nv-barsWrap');
                contextEnter.append('g').attr('class', 'nv-linesWrap');
                contextEnter.append('g').attr('class', 'nv-brushBackground');
                contextEnter.append('g').attr('class', 'nv-x nv-brush');

                //============================================================
                // Legend
                //------------------------------------------------------------

                if (requestState === cowc.DATA_REQUEST_STATE_SUCCESS_NOT_EMPTY && showLegend) {
                    var legendWidth = availableWidth,
                        legendXPosition = 0;

                    legend.width(legendWidth);

                    g.select('.nv-legendWrap')
                        .datum(data.map(function(series) {
                            series.originalKey = series.originalKey === undefined ? series.key : series.originalKey;
                            series.key = series.originalKey + (series.bar ? legendLeftAxisHint : legendRightAxisHint);
                            return series;
                        }))
                        .call(legend);

                    if ( margin.top != legend.height()) {
                        margin.top = legend.height();
                        // FIXME: shouldn't this be "- (focusEnabled ? focusHeight : 0)"?
                        availableHeight1 = nv.utils.availableHeight(height, container, margin) - focusHeight;
                    }

                    g.select('.nv-legendWrap')
                        .attr('transform', 'translate(' + legendXPosition + ',' + (-margin.top) +')');
                }

                wrap.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

                //============================================================
                // Context chart (focus chart) components
                //------------------------------------------------------------

                // hide or show the focus context chart
                g.select('.nv-context').style('display', (focusEnable && requestState === cowc.DATA_REQUEST_STATE_SUCCESS_NOT_EMPTY) ? 'initial' : 'none');

                bars2
                    .width(availableWidth)
                    .height(availableHeight2)
                    .color(data.map(function (d, i) {
                        return d.color || color(d, i);
                    }).filter(function (d, i) {
                        return !data[i].disabled && data[i].bar
                    }));
                lines2
                    .width(availableWidth)
                    .height(availableHeight2)
                    .color(data.map(function (d, i) {
                        return d.color || color(d, i);
                    }).filter(function (d, i) {
                        return !data[i].disabled && !data[i].bar
                    }));

                var bars2Wrap = g.select('.nv-context .nv-barsWrap')
                    .datum(dataBars.length ? dataBars : [
                        {values: []}
                    ]);
                var lines2Wrap = g.select('.nv-context .nv-linesWrap')
                    .datum(data.filter(function(d) { return !d.disabled && !d.bar; }));

                g.select('.nv-context')
                    .attr('transform', 'translate(0,' + ( availableHeight1 + margin.bottom + margin2.top) + ')');

                bars2Wrap.transition().call(bars2);
                lines2Wrap.transition().call(lines2);

                // context (focus chart) axis controls
                if (focusShowAxisX) {
                    x2Axis
                        ._ticks( nv.utils.calcTicksX(availableWidth / 100, data))
                        .tickSize(-availableHeight2, 0);
                    g.select('.nv-context .nv-x.nv-axis')
                        .attr('transform', 'translate(0,' + y3.range()[0] + ')');
                    g.select('.nv-context .nv-x.nv-axis').transition()
                        .call(x2Axis);
                }

                if (focusShowAxisY) {
                    y3Axis
                        .scale(y3)
                        ._ticks( availableHeight2 / 36 )
                        .tickSize( -availableWidth, 0);
                    y4Axis
                        .scale(y4)
                        ._ticks( availableHeight2 / 36 )
                        .tickSize(dataBars.length ? 0 : -availableWidth, 0); // Show the y2 rules only if y1 has none

                    g.select('.nv-context .nv-y3.nv-axis')
                        .attr('transform', 'translate(0,' + x2.range()[0] + ')');
                    g.select('.nv-context .nv-y2.nv-axis')
                        .attr('transform', 'translate(' + x2.range()[1] + ',0)');

                    g.select('.nv-context .nv-y1.nv-axis').transition()
                        .call(y3Axis);
                    g.select('.nv-context .nv-y2.nv-axis').transition()
                        .call(y4Axis);
                }

                // Setup Brush
                brush.x(x2).on('brush', onBrush);

                if (brushExtent) brush.extent(brushExtent);

                var brushBG = g.select('.nv-brushBackground').selectAll('g')
                    .data([brushExtent || brush.extent()]);

                var brushBGenter = brushBG.enter()
                    .append('g');

                brushBGenter.append('rect')
                    .attr('class', 'left')
                    .attr('x', 0)
                    .attr('y', 0)
                    .attr('height', availableHeight2);

                brushBGenter.append('rect')
                    .attr('class', 'right')
                    .attr('x', 0)
                    .attr('y', 0)
                    .attr('height', availableHeight2);

                var gBrush = g.select('.nv-x.nv-brush')
                    .call(brush);
                gBrush.selectAll('rect')
                    //.attr('y', -5)
                    .attr('height', availableHeight2);
                gBrush.selectAll('.resize').append('path').attr('d', resizePath);

                //============================================================
                // Event Handling/Dispatching (in chart's scope)
                //------------------------------------------------------------

                if (requestState === cowc.DATA_REQUEST_STATE_SUCCESS_NOT_EMPTY) {
                    legend.dispatch.on('stateChange', function (newState) {
                        for (var key in newState)
                            state[key] = newState[key];
                        dispatch.stateChange(state);
                        chartModel.update();
                    });

                    // Update chart from a state object passed to event handler
                    dispatch.on('changeState', function (e) {
                        if (typeof e.disabled !== 'undefined') {
                            data.forEach(function (series, i) {
                                series.disabled = e.disabled[i];
                            });
                            state.disabled = e.disabled;
                        }
                        chartModel.update();
                    });
                }

                //============================================================
                // Functions
                //------------------------------------------------------------

                // Taken from crossfilter (http://square.github.com/crossfilter/)
                function resizePath(d) {
                    var e = +(d == 'e'),
                        x = e ? 1 : -1,
                        y = availableHeight2 / 3;
                    return 'M' + (.5 * x) + ',' + y
                        + 'A6,6 0 0 ' + e + ' ' + (6.5 * x) + ',' + (y + 6)
                        + 'V' + (2 * y - 6)
                        + 'A6,6 0 0 ' + e + ' ' + (.5 * x) + ',' + (2 * y)
                        + 'Z'
                        + 'M' + (2.5 * x) + ',' + (y + 8)
                        + 'V' + (2 * y - 8)
                        + 'M' + (4.5 * x) + ',' + (y + 8)
                        + 'V' + (2 * y - 8);
                }

                function updateBrushBG() {
                    if (!brush.empty()) brush.extent(brushExtent);
                    brushBG
                        .data([brush.empty() ? x2.domain() : brushExtent])
                        .each(function(d,i) {
                            var leftWidth = x2(d[0]) - x2.range()[0],
                                rightWidth = x2.range()[1] - x2(d[1]);

                            d3.select(this).select('.left')
                                .attr('width',  (leftWidth < 0 || isNaN(leftWidth)) ? 0 : leftWidth);

                            d3.select(this).select('.right')
                                .attr('x', isNaN(rightWidth) ? 0 : x2(d[1]))
                                .attr('width', (rightWidth < 0 || isNaN(rightWidth)) ? 0 : rightWidth);
                        });
                }

                function onBrush() {
                    brushExtent = brush.empty() ? null : brush.extent();
                    extent = brush.empty() ? x2.domain() : brush.extent();
                    dispatch.brush({extent: extent, brush: brush});
                    updateBrushBG();

                    // Prepare Main (Focus) Bars and Lines
                    bars
                        .width(availableWidth)
                        .height(availableHeight1)
                        .color(data.map(function(d,i) {
                            return d.color || color(d, i);
                        }).filter(function(d,i) { return !data[i].disabled && data[i].bar }));

                    lines
                        .width(availableWidth)
                        .height(availableHeight1)
                        .color(data.map(function(d,i) {
                            return d.color || color(d, i);
                        }).filter(function(d,i) { return !data[i].disabled && !data[i].bar }));

                    var focusBarsWrap = g.select('.nv-focus .nv-barsWrap')
                        .datum(!dataBars.length ? [{values:[]}] :
                            dataBars
                                .map(function(d,i) {
                                    return {
                                        key: d.key,
                                        values: d.values.filter(function(d,i) {
                                            return bars.x()(d,i) >= extent[0] && bars.x()(d,i) <= extent[1];
                                        })
                                    }
                                })
                    );

                    var focusLinesWrap = g.select('.nv-focus .nv-linesWrap')
                        .datum(data
                            .filter(function(d) { return !d.disabled && !d.bar })
                            .map(function(d,i) {
                                return {
                                    area: d.area,
                                    key: d.key,
                                    values: d.values.filter(function(d,i) {
                                        return lines.x()(d,i) >= extent[0] && lines.x()(d,i) <= extent[1];
                                    })
                                }
                            })
                        );

                    // Update Main (Focus) X Axis
                    if (dataBars.length) {
                        x = bars.xScale();
                    } else {
                        x = lines.xScale();
                    }

                    xAxis
                        .scale(x)
                        ._ticks( nv.utils.calcTicksX(availableWidth/100, data) )
                        .tickSize(-availableHeight1, 0);

                    xAxis.domain([Math.ceil(extent[0]), Math.floor(extent[1])]);

                    g.select('.nv-x.nv-axis').transition().duration(transitionDuration)
                        .call(xAxis);

                    // Update Main (Focus) Bars and Lines
                    focusBarsWrap.transition().duration(transitionDuration).call(bars);
                    focusLinesWrap.transition().duration(transitionDuration).call(lines);

                    // Setup and Update Main (Focus) Y Axes
                    g.select('.nv-focus .nv-x.nv-axis')
                        .attr('transform', 'translate(0,' + y1.range()[0] + ')');

                    y1Axis
                        .scale(y1)
                        ._ticks( nv.utils.calcTicksY(availableHeight1/36, data) )
                        .tickSize(-availableWidth, 0);
                    y2Axis
                        .scale(y2)
                        ._ticks( nv.utils.calcTicksY(availableHeight1/36, data) )
                        .tickSize(dataBars.length ? 0 : -availableWidth, 0); // Show the y2 rules only if y1 has none

                    g.select('.nv-focus .nv-y1.nv-axis')
                    g.select('.nv-focus .nv-y2.nv-axis')
                        .attr('transform', 'translate(' + x2.range()[1] + ',0)');

                    g.select('.nv-focus .nv-y1.nv-axis').transition().duration(transitionDuration)
                        .call(y1Axis);
                    g.select('.nv-focus .nv-y2.nv-axis').transition().duration(transitionDuration)
                        .call(y2Axis);
                }

                onBrush();

            });

            return chartModel;
        }

        //============================================================
        // Event Handling/Dispatching (out of chart's scope)
        //------------------------------------------------------------

        lines.dispatch.on('elementMouseover.tooltip', function(evt) {
            tooltip
                .duration(100)
                .valueFormatter(function(d, i) {
                    return y2Axis.tickFormat()(d, i);
                })
                .data(evt)
                .position(evt.pos)
                .hidden(false);
        });

        lines.dispatch.on('elementMouseout.tooltip', function(evt) {
            tooltip.hidden(true)
        });

        bars.dispatch.on('elementMouseover.tooltip', function(evt) {
            evt.value = chartModel.x()(evt.data);
            evt['series'] = {
                value: chartModel.y()(evt.data),
                color: evt.color
            };
            tooltip
                .duration(0)
                .valueFormatter(function(d, i) {
                    return y1Axis.tickFormat()(d, i);
                })
                .data(evt)
                .hidden(false);
        });

        bars.dispatch.on('elementMouseout.tooltip', function(evt) {
            tooltip.hidden(true);
        });

        bars.dispatch.on('elementMousemove.tooltip', function(evt) {
            tooltip.position({top: d3.event.pageY, left: d3.event.pageX})();
        });

        //============================================================


        //============================================================
        // Expose Public Variables
        //------------------------------------------------------------

        // expose chart's sub-components
        chartModel.dispatch = dispatch;
        chartModel.legend = legend;
        chartModel.lines = lines;
        chartModel.lines2 = lines2;
        chartModel.bars = bars;
        chartModel.bars2 = bars2;
        chartModel.xAxis = xAxis;
        chartModel.x2Axis = x2Axis;
        chartModel.y1Axis = y1Axis;
        chartModel.y2Axis = y2Axis;
        chartModel.y3Axis = y3Axis;
        chartModel.y4Axis = y4Axis;
        chartModel.tooltip = tooltip;

        chartModel.options = nv.utils.optionsFunc.bind(chartModel);

        chartModel._options = Object.create({}, {
            // simple options, just get/set the necessary values
            width:      {get: function(){return width;}, set: function(_){width=_;}},
            height:     {get: function(){return height;}, set: function(_){height=_;}},
            showLegend: {get: function(){return showLegend;}, set: function(_){showLegend=_;}},
            brushExtent:    {get: function(){return brushExtent;}, set: function(_){brushExtent=_;}},
            noData:    {get: function(){return noData;}, set: function(_){noData=_;}},
            focusEnable:    {get: function(){return focusEnable;}, set: function(_){focusEnable=_;}},
            focusHeight:    {get: function(){return focusHeight;}, set: function(_){focusHeight=_;}},
            focusShowAxisX:    {get: function(){return focusShowAxisX;}, set: function(_){focusShowAxisX=_;}},
            focusShowAxisY:    {get: function(){return focusShowAxisY;}, set: function(_){focusShowAxisY=_;}},
            legendLeftAxisHint:    {get: function(){return legendLeftAxisHint;}, set: function(_){legendLeftAxisHint=_;}},
            legendRightAxisHint:    {get: function(){return legendRightAxisHint;}, set: function(_){legendRightAxisHint=_;}},

            // deprecated options
            tooltips:    {get: function(){return tooltip.enabled();}, set: function(_){
                // deprecated after 1.7.1
                nv.deprecated('tooltips', 'use chart.tooltip.enabled() instead');
                tooltip.enabled(!!_);
            }},
            tooltipContent:    {get: function(){return tooltip.contentGenerator();}, set: function(_){
                // deprecated after 1.7.1
                nv.deprecated('tooltipContent', 'use chart.tooltip.contentGenerator() instead');
                tooltip.contentGenerator(_);
            }},

            // options that require extra logic in the setter
            margin: {get: function(){return margin;}, set: function(_){
                margin.top    = _.top    !== undefined ? _.top    : margin.top;
                margin.right  = _.right  !== undefined ? _.right  : margin.right;
                margin.bottom = _.bottom !== undefined ? _.bottom : margin.bottom;
                margin.left   = _.left   !== undefined ? _.left   : margin.left;
            }},
            duration: {get: function(){return transitionDuration;}, set: function(_){
                transitionDuration = _;
            }},
            color:  {get: function(){return color;}, set: function(_){
                color = nv.utils.getColor(_);
                legend.color(color);
            }},
            x: {get: function(){return getX;}, set: function(_){
                getX = _;
                lines.x(_);
                lines2.x(_);
                bars.x(_);
                bars2.x(_);
            }},
            y: {get: function(){return getY;}, set: function(_){
                getY = _;
                lines.y(_);
                lines2.y(_);
                bars.y(_);
                bars2.y(_);
            }}
        });

        nv.utils.inheritOptions(chartModel, lines);
        nv.utils.initOptions(chartModel);

        //============================================================
        // Customize NVD3 Chart: Following code has been added by Juniper to
        // customize LineBarWithFocusChart.
        //------------------------------------------------------------

        chartModel.legendRightAxisHint('')
                  .legendLeftAxisHint('')
                  .brushExtent(chartOptions['brushExtent']);

        chartModel.interpolate(chUtils.interpolateSankey);
        //chartModel.bars.padData(false);

        if(chartOptions.forceY1) {
            chartModel.bars.forceY(chartOptions.forceY1);
            chartModel.bars2.forceY(chartOptions.forceY1);
        }

        if(chartOptions.forceY2) {
            chartModel.lines.forceY(chartOptions.forceY2);
            chartModel.lines2.forceY(chartOptions.forceY2);
        }

        chartModel.xAxis.tickFormat(function (d) {
            return d3.time.format('%H:%M')(new Date(d));
        });

        chartModel.x2Axis.axisLabel("Time").tickFormat(function (d) {
            return d3.time.format('%H:%M')(new Date(d));
        });

        chartModel.y1Axis.axisLabel(chartOptions.y1AxisLabel)
                         .axisLabelDistance(chartOptions.axisLabelDistance)
                         .tickFormat(chartOptions['y1Formatter'])
                         .showMaxMin(false);

        chartModel.y2Axis.axisLabel(chartOptions.y2AxisLabel)
                         .axisLabelDistance(chartOptions.axisLabelDistance)
                         .tickFormat(chartOptions['y2Formatter'])
                         .showMaxMin(false);

        chartModel.showLegend(chartOptions.showLegend);

        return chartModel;
    };

    return LineBarWithFocusChartModel;
});
/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */

define('core-basedir/js/views/LineBarWithFocusChartView',[
    'underscore',
    'contrail-view',
    'core-basedir/js/models/LineBarWithFocusChartModel',
    'contrail-list-model',
    'nv.d3'
], function (_, ContrailView, LineBarWithFocusChartModel, ContrailListModel) {
    var LineBarWithFocusChartView = ContrailView.extend({
        render: function () {
            var viewConfig = this.attributes.viewConfig,
                ajaxConfig = viewConfig['ajaxConfig'],
                self = this, deferredObj = $.Deferred(),
                selector = $(self.$el),
                modelMap = contrail.handleIfNull(self.modelMap, {});

            if (contrail.checkIfExist(viewConfig.modelKey) && contrail.checkIfExist(modelMap[viewConfig.modelKey])) {
                self.model = modelMap[viewConfig.modelKey]
            }

            if (self.model === null && viewConfig['modelConfig'] != null) {
                self.model = new ContrailListModel(viewConfig['modelConfig']);
            }

            self.renderChart(selector, viewConfig, self.model);

            if (self.model !== null) {
                if (self.model.loadedFromCache || !(self.model.isRequestInProgress())) {
                    self.renderChart(selector, viewConfig, self.model);
                }

                self.model.onAllRequestsComplete.subscribe(function () {
                    self.renderChart(selector, viewConfig, self.model);
                });

                if (viewConfig.loadChartInChunks) {
                    self.model.onDataUpdate.subscribe(function () {
                        self.renderChart(selector, viewConfig, self.model);
                    });
                }
            }
        },

        renderChart: function (selector, viewConfig, chartViewModel) {
            var self = this,
                data = chartViewModel.getItems(),
                chartTemplate = contrail.getTemplate4Id(cowc.TMPL_CHART),
                widgetConfig = contrail.checkIfExist(viewConfig.widgetConfig) ? viewConfig.widgetConfig : null,
                chartViewConfig, chartOptions, chartModel;

            if (contrail.checkIfFunction(viewConfig['parseFn'])) {
                data = viewConfig['parseFn'](data);
            }

            chartViewConfig = getChartViewConfig(data, viewConfig.chartOptions);
            chartOptions = chartViewConfig['chartOptions'];
            //viewConfig.chartOptions = chartOptions;
            chartModel = new LineBarWithFocusChartModel(chartOptions);
            chartModel.chartOptions = chartOptions;

            self.chartModel = chartModel;

            if ($(selector).find("svg") != null) {
                $(selector).empty();
            }

            $(selector).append(chartTemplate(chartOptions));

            //Store the chart object as a data attribute so that the chart can be updated dynamically
            $(selector).data('chart', chartModel);

            nv.addGraph(function () {
                if (!($(selector).is(':visible'))) {
                    $(selector).find('svg').bind("refresh", function () {
                        setData2Chart(self, chartViewConfig, chartViewModel, chartModel);
                    });
                    
                } else {
                    setData2Chart(self, chartViewConfig, chartViewModel, chartModel);
                }
                var resizeFunction = function (e) {
                    if ($(selector).is(':visible')) {
                        setData2Chart(self, chartViewConfig, chartViewModel, chartModel);
                    }
                };
                $(window)
                    .off('resize', resizeFunction)
                    .on('resize', resizeFunction);

                nv.utils.windowResize(chartModel.update);

                chartModel.dispatch.on('stateChange', function (e) {
                    nv.log('New State:', JSON.stringify(e));
                });
                return chartModel;
            });

            if (widgetConfig !== null) {
                this.renderView4Config(selector.find('.chart-container'), chartViewModel, widgetConfig, null, null, null);
            }
        },

        renderMessage: function(message, selector, chartOptions) {
            var self = this,
                message = contrail.handleIfNull(message, ""),
                selector = contrail.handleIfNull(selector, $(self.$el)),
                chartOptions = contrail.handleIfNull(chartOptions, self.chartModel.chartOptions),
                container = d3.select($(selector).find("svg")[0]),
                requestStateText = container.selectAll('.nv-requestState').data([message]),
                textPositionX = $(selector).width() / 2,
                textPositionY = chartOptions.margin.top + $(selector).find('.nv-focus').heightSVG() / 2 + 10;

            requestStateText
                .enter().append('text')
                .attr('class', 'nvd3 nv-requestState')
                .attr('dy', '-.7em')
                .style('text-anchor', 'middle');

            requestStateText
                .attr('x', textPositionX)
                .attr('y', textPositionY)
                .text(function(t){ return t; });
        },

        removeMessage: function(selector) {
            var self = this,
                selector = contrail.handleIfNull(selector, $(self.$el));

            $(selector).find('.nv-requestState').remove();
        }
    });

    function setData2Chart(self, chartViewConfig, chartViewModel, chartModel) {

        var chartData = chartViewConfig.chartData,
            checkEmptyDataCB = function (data) {
                return (!data || data.length === 0 || !data.filter(function (d) { return d.values.length; }).length);
            },
            chartDataRequestState = cowu.getRequestState4Model(chartViewModel, chartData, checkEmptyDataCB),
            chartDataObj = {
                data: chartData,
                requestState: chartDataRequestState
            },
            chartOptions = chartViewConfig['chartOptions'];

        d3.select($(self.$el)[0]).select('svg').datum(chartDataObj).call(chartModel);

        if (chartOptions.defaultDataStatusMessage) {
            var messageHandler = chartOptions.statusMessageHandler;
            self.renderMessage(messageHandler(chartDataRequestState));
        } else {
            self.removeMessage();
        }
    }

    function getChartViewConfig(chartData, chartOptions) {
        var chartViewConfig = {};

        var chartOptions = $.extend(true, {}, covdc.lineBarWithFocusChartConfig, chartOptions);

        chartOptions['forceY1'] = getForceY1Axis(chartData, chartOptions['forceY1']);
        chartOptions['forceY2'] = getForceY2Axis(chartData, chartOptions['forceY2']);

        if (chartData.length > 0) {
            var values = chartData[0].values,
                brushExtent = null,
                start, end;

            if (values.length >= 25) {
                start = values[values.length - 25];
                end = values[values.length - 1];
                chartOptions['brushExtent'] = [chUtils.getViewFinderPoint(start.x), chUtils.getViewFinderPoint(end.x)];
            }
        }

        chartViewConfig['chartData'] = chartData;
        chartViewConfig['chartOptions'] = chartOptions;

        return chartViewConfig;
    };

    function getForceY1Axis(chartData, defaultForceY1) {
        var dataBars = chartData.filter(function (d) {
                return !d.disabled && d.bar
            }),
            dataAllBars = [], forceY1;

        for (var j = 0; j < dataBars.length; j++) {
            dataAllBars = dataAllBars.concat(dataBars[j]['values']);
        }

        forceY1 = cowu.getForceAxis4Chart(dataAllBars, "y", defaultForceY1);
        return forceY1;
    };

    function getForceY2Axis(chartData, defaultForceY2) {
        var dataLines = chartData.filter(function (d) {
                return !d.bar
            }),
            dataAllLines = [], forceY2;

        for (var i = 0; i < dataLines.length; i++) {
            dataAllLines = dataAllLines.concat(dataLines[i]['values']);
        }

        forceY2 = cowu.getForceAxis4Chart(dataAllLines, "y", defaultForceY2);
        return forceY2;
    };

    return LineBarWithFocusChartView;
});

/*
 ##Juniper License

 Copyright (c) 2014 Juniper Networks, Inc.

 ##nvd3.js License

 Copyright (c) 2011-2014 [Novus Partners, Inc.][novus]

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.

 [novus]: https://www.novus.com/

 ##d3.js License

 Copyright (c) 2012, Michael Bostock
 All rights reserved.

 Redistribution and use in source and binary forms, with or without
 modification, are permitted provided that the following conditions are met:

 * Redistributions of source code must retain the above copyright notice, this
 list of conditions and the following disclaimer.

 * Redistributions in binary form must reproduce the above copyright notice,
 this list of conditions and the following disclaimer in the documentation
 and/or other materials provided with the distribution.

 * The name Michael Bostock may not be used to endorse or promote products
 derived from this software without specific prior written permission.

 THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 DISCLAIMED. IN NO EVENT SHALL MICHAEL BOSTOCK BE LIABLE FOR ANY DIRECT,
 INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
 BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
 EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

define('core-basedir/js/models/LineWithFocusChartModel',[
    'underscore'
], function (_) {
    var LineWithFocusChartModel = function (chartOptions) {
        "use strict";

        //============================================================
        // Public Variables with Default Settings
        //------------------------------------------------------------

        var lines = nv.models.line()
            , lines2 = nv.models.line()
            , xAxis = nv.models.axis()
            , yAxis = nv.models.axis()
            , x2Axis = nv.models.axis()
            , y2Axis = nv.models.axis()
            , legend = nv.models.legend()
            , brush = d3.svg.brush()
            , tooltip = nv.models.tooltip()
            , interactiveLayer = nv.interactiveGuideline()
            ;

        var margin = chartOptions.margin
            , margin2 = chartOptions.margin2
            , color = nv.utils.defaultColor()
            , width = null
            , height = null
            , height2 = 90
            , useInteractiveGuideline = false
            , xScale
            , yScale
            , x2
            , y2
            , showLegend = true
            , brushExtent = null
            , focusShowAxisY = false
            , noData = null
            , dispatch = d3.dispatch('brush', 'stateChange', 'changeState')
            , transitionDuration = 250
            , state = nv.utils.state()
            , defaultState = null
            ;

        lines.clipEdge(false).duration(0);
        lines2.interactive(false);
        xAxis.orient('bottom').tickPadding(5);
        yAxis.orient('left');
        x2Axis.orient('bottom').tickPadding(5);
        y2Axis.orient('left');

        tooltip.valueFormatter(function (d, i) {
            return yAxis.tickFormat()(d, i);
        }).headerFormatter(function (d, i) {
            return xAxis.tickFormat()(d, i);
        });

        //============================================================
        // Private Variables
        //------------------------------------------------------------

        var stateGetter = function (data) {
            return function () {
                return {
                    active: data.map(function (d) {
                        return !d.disabled
                    })
                };
            }
        };

        var stateSetter = function (data) {
            return function (state) {
                if (state.active !== undefined)
                    data.forEach(function (series, i) {
                        series.disabled = !state.active[i];
                    });
            }
        };

        function chartModel(selection) {
            selection.each(function (chartDataObj) {
                var container = d3.select(this),
                    that = this,
                    data = chartDataObj.data,
                    requestState = chartDataObj.requestState,
                    yDataKey = contrail.checkIfExist(chartOptions.chartAxesOptionKey) ? chartOptions.chartAxesOptionKey : 'y';

                nv.utils.initSVG(container);
                var availableWidth = nv.utils.availableWidth(width, container, margin),
                    availableHeight1 = nv.utils.availableHeight(height, container, margin) - height2,
                    availableHeight2 = height2 - margin2.top - margin2.bottom;

                chartModel.update = function () {
                    container.transition().duration(transitionDuration).call(chartModel)
                };
                chartModel.container = this;

                state
                    .setter(stateSetter(data), chartModel.update)
                    .getter(stateGetter(data))
                    .update();

                // DEPRECATED set state.disableddisabled
                state.disabled = data.map(function (d) {
                    return !!d.disabled
                });

                if (!defaultState) {
                    var key;
                    defaultState = {};
                    for (key in state) {
                        if (state[key] instanceof Array)
                            defaultState[key] = state[key].slice(0);
                        else
                            defaultState[key] = state[key];
                    }
                }

                // Setup Scales
                xScale = lines.xScale();
                yScale = lines.yScale();
                x2 = lines2.xScale();
                y2 = lines2.yScale();

                // Setup containers and skeleton of chart
                var wrap = container.selectAll('g.nv-wrap.nv-lineWithFocusChart').data([data]);
                var gEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap nv-lineWithFocusChart').append('g');
                var g = wrap.select('g');

                gEnter.append('g').attr('class', 'nv-legendWrap');

                var focusEnter = gEnter.append('g').attr('class', 'nv-focus');
                focusEnter.append('g').attr('class', 'nv-x nv-axis');
                focusEnter.append('g').attr('class', 'nv-y nv-axis');
                focusEnter.append('g').attr('class', 'nv-linesWrap');
                focusEnter.append('g').attr('class', 'nv-interactive');

                var contextEnter = gEnter.append('g').attr('class', 'nv-context');
                contextEnter.append('g').attr('class', 'nv-x nv-axis');
                contextEnter.append('g').attr('class', 'nv-y nv-axis');
                contextEnter.append('g').attr('class', 'nv-linesWrap');
                contextEnter.append('g').attr('class', 'nv-brushBackground');
                contextEnter.append('g').attr('class', 'nv-x nv-brush');

                // Legend
                /*if (requestState === cowc.DATA_REQUEST_STATE_SUCCESS_NOT_EMPTY && showLegend) {
                    legend.width(availableWidth);

                    g.select('.nv-legendWrap')
                        .datum(data)
                        .call(legend);

                    if (margin.top != legend.height()) {
                        margin.top = legend.height();
                        availableHeight1 = nv.utils.availableHeight(height, container, margin) - height2;
                    }

                    g.select('.nv-legendWrap')
                        .attr('transform', 'translate(0,' + (-margin.top) + ')')
                }*/

                wrap.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');


                //Set up interactive layer
                if (useInteractiveGuideline) {
                    interactiveLayer
                        .width(availableWidth)
                        .height(availableHeight1)
                        .margin({left: margin.left, top: margin.top})
                        .svgContainer(container)
                        .xScale(xScale);
                    wrap.select(".nv-interactive").call(interactiveLayer);
                }

                // Main Chart Component(s)
                lines
                    .y(function (d, i) {
                        return d[yDataKey]
                    })
                    .width(availableWidth)
                    .height(availableHeight1)
                    .color(
                    data
                        .map(function (d, i) {
                            return d.color || color(d, i);
                        })
                        .filter(function (d, i) {
                            return !data[i].disabled;
                        })
                );

                lines2
                    .defined(lines.defined())
                    .y(function (d, i) {
                        return d[yDataKey]
                    })
                    .width(availableWidth)
                    .height(availableHeight2)
                    .color(
                    data
                        .map(function (d, i) {
                            return d.color || color(d, i);
                        })
                        .filter(function (d, i) {
                            return !data[i].disabled;
                        })
                );

                g.select('.nv-context')
                    .attr('transform', 'translate(0,' + ( availableHeight1 + margin.bottom + margin2.top) + ')')

                var contextLinesWrap = g.select('.nv-context .nv-linesWrap')
                    .datum(data.filter(function (d) {
                        return !d.disabled
                    }));

                d3.transition(contextLinesWrap).call(lines2);

                // Setup Main (Focus) Axes
                xAxis
                    .scale(xScale)
                    ._ticks(nv.utils.calcTicksX(availableWidth / 100, data))
                    .tickSize(-availableHeight1, 0);

                yAxis
                    .scale(yScale)
                    ._ticks(nv.utils.calcTicksY(availableHeight1 / 40, data))
                    .tickSize(-availableWidth, 0);

                g.select('.nv-focus .nv-x.nv-axis')
                    .attr('transform', 'translate(0,' + availableHeight1 + ')');

                // Setup Brush
                brush
                    .x(x2)
                    .on('brush', function () {
                        onBrush();
                    });

                if (brushExtent) brush.extent(brushExtent);

                var brushBG = g.select('.nv-brushBackground').selectAll('g')
                    .data([brushExtent || brush.extent()])

                var brushBGenter = brushBG.enter()
                    .append('g');

                brushBGenter.append('rect')
                    .attr('class', 'left')
                    .attr('x', 0)
                    .attr('y', 0)
                    .attr('height', availableHeight2);

                brushBGenter.append('rect')
                    .attr('class', 'right')
                    .attr('x', 0)
                    .attr('y', 0)
                    .attr('height', availableHeight2);

                var gBrush = g.select('.nv-x.nv-brush')
                    .call(brush);
                gBrush.selectAll('rect')
                    .attr('height', availableHeight2);
                gBrush.selectAll('.resize').append('path').attr('d', resizePath);

                onBrush();

                // Setup Secondary (Context) Axes
                x2Axis
                    .scale(x2)
                    ._ticks(nv.utils.calcTicksX(availableWidth / 100, data))
                    .tickSize(-availableHeight2, 0);

                g.select('.nv-context .nv-x.nv-axis')
                    .attr('transform', 'translate(0,' + y2.range()[0] + ')');
                d3.transition(g.select('.nv-context .nv-x.nv-axis'))
                    .call(x2Axis);

                if(focusShowAxisY) {
                    y2Axis
                        .scale(y2)
                        ._ticks(nv.utils.calcTicksY(availableHeight2 / 36, data))
                        .tickSize(-availableWidth, 0);

                    d3.transition(g.select('.nv-context .nv-y.nv-axis'))
                        .call(y2Axis);
                }

                g.select('.nv-context .nv-x.nv-axis')
                    .attr('transform', 'translate(0,' + y2.range()[0] + ')');

                g.select('.nv-context').style('display', (requestState === cowc.DATA_REQUEST_STATE_SUCCESS_NOT_EMPTY) ? 'initial' : 'none');

                //============================================================
                // Event Handling/Dispatching (in chart's scope)
                //------------------------------------------------------------

                if (requestState === cowc.DATA_REQUEST_STATE_SUCCESS_NOT_EMPTY) {
                    legend.dispatch.on('stateChange', function (newState) {
                        for (var key in newState)
                            state[key] = newState[key];
                        dispatch.stateChange(state);
                        chartModel.update();
                    });

                    interactiveLayer.dispatch.on('elementMousemove', function (e) {
                        lines.clearHighlights();
                        var singlePoint, pointIndex, pointXLocation, allData = [];
                        data
                            .filter(function (series, i) {
                                series.seriesIndex = i;
                                return !series.disabled;
                            })
                            .forEach(function (series, i) {
                                var extent = brush.empty() ? x2.domain() : brush.extent();
                                var currentValues = series.values.filter(function (d, i) {
                                    return lines.x()(d, i) >= extent[0] && lines.x()(d, i) <= extent[1];
                                });

                                pointIndex = nv.interactiveBisect(currentValues, e.pointXValue, lines.x());
                                var point = currentValues[pointIndex];
                                var pointYValue = chartModel.y()(point, pointIndex);
                                if (pointYValue != null) {
                                    lines.highlightPoint(i, pointIndex, true);
                                }
                                if (point === undefined) return;
                                if (singlePoint === undefined) singlePoint = point;
                                if (pointXLocation === undefined) pointXLocation = chartModel.xScale()(chartModel.x()(point, pointIndex));
                                allData.push({
                                    key: (yDataKey != 'y') ? yDataKey : series.key,
                                    value: chartModel.y()(point, pointIndex),
                                    color: color(series, series.seriesIndex)
                                });
                            });
                        //Highlight the tooltip entry based on which point the mouse is closest to.
                        if (allData.length > 2) {
                            var yValue = chartModel.yScale().invert(e.mouseY);
                            var domainExtent = Math.abs(chartModel.yScale().domain()[0] - chartModel.yScale().domain()[1]);
                            var threshold = 0.03 * domainExtent;
                            var indexToHighlight = nv.nearestValueIndex(allData.map(function (d) {
                                return d.value
                            }), yValue, threshold);
                            if (indexToHighlight !== null)
                                allData[indexToHighlight].highlight = true;
                        }

                        var xValue = xAxis.tickFormat()(chartModel.x()(singlePoint, pointIndex));
                        interactiveLayer.tooltip
                            .position({left: e.mouseX + margin.left, top: e.mouseY + margin.top})
                            .chartContainer(that.parentNode)
                            .valueFormatter(function (d, i) {
                                return d == null ? "N/A" : yAxis.tickFormat()(d);
                            })
                            .data({
                                value: xValue,
                                index: pointIndex,
                                series: allData
                            })();

                        interactiveLayer.renderGuideLine(pointXLocation);
                    });

                    interactiveLayer.dispatch.on("elementMouseout", function (e) {
                        lines.clearHighlights();
                    });

                    dispatch.on('changeState', function (e) {
                        if (typeof e.disabled !== 'undefined') {
                            data.forEach(function (series, i) {
                                series.disabled = e.disabled[i];
                            });
                        }
                        chartModel.update();
                    });
                }

                //============================================================
                // Functions
                //------------------------------------------------------------

                // Taken from crossfilter (http://square.github.com/crossfilter/)
                function resizePath(d) {
                    var e = +(d == 'e'),
                        x = e ? 1 : -1,
                        y = availableHeight2 / 3;
                    return 'M' + (.5 * x) + ',' + y
                        + 'A6,6 0 0 ' + e + ' ' + (6.5 * x) + ',' + (y + 6)
                        + 'V' + (2 * y - 6)
                        + 'A6,6 0 0 ' + e + ' ' + (.5 * x) + ',' + (2 * y)
                        + 'Z'
                        + 'M' + (2.5 * x) + ',' + (y + 8)
                        + 'V' + (2 * y - 8)
                        + 'M' + (4.5 * x) + ',' + (y + 8)
                        + 'V' + (2 * y - 8);
                }


                function updateBrushBG() {
                    if (!brush.empty()) brush.extent(brushExtent);
                    brushBG
                        .data([brush.empty() ? x2.domain() : brushExtent])
                        .each(function (d, i) {
                            var leftWidth = x2(d[0]) - xScale.range()[0],
                                rightWidth = availableWidth - x2(d[1]);
                            d3.select(this).select('.left')
                                .attr('width', leftWidth < 0 ? 0 : leftWidth);

                            d3.select(this).select('.right')
                                .attr('x', x2(d[1]))
                                .attr('width', rightWidth < 0 ? 0 : rightWidth);
                        });
                }


                function onBrush() {
                    brushExtent = brush.empty() ? null : brush.extent();
                    var extent = brush.empty() ? x2.domain() : brush.extent();

                    //The brush extent cannot be less than one.  If it is, don't update the line chart.
                    if (Math.abs(extent[0] - extent[1]) <= 1) {
                        return;
                    }

                    dispatch.brush({extent: extent, brush: brush});


                    updateBrushBG();

                    // Update Main (Focus)
                    var focusLinesWrap = g.select('.nv-focus .nv-linesWrap')
                        .datum(
                        data
                            .filter(function (d) {
                                return !d.disabled
                            })
                            .map(function (d, i) {
                                return {
                                    key: d.key,
                                    area: d.area,
                                    values: d.values.filter(function (d, i) {
                                        return lines.x()(d, i) >= extent[0] && lines.x()(d, i) <= extent[1];
                                    })
                                }
                            })
                    );
                    focusLinesWrap.transition().duration(transitionDuration).call(lines);


                    // Update Main (Focus) Axes
                    g.select('.nv-focus .nv-x.nv-axis').transition().duration(transitionDuration)
                        .call(xAxis);
                    g.select('.nv-focus .nv-y.nv-axis').transition().duration(transitionDuration)
                        .call(yAxis);
                }
            });

            return chartModel;
        }

        //============================================================
        // Event Handling/Dispatching (out of chart's scope)
        //------------------------------------------------------------

        lines.dispatch.on('elementMouseover.tooltip', function (evt) {
            tooltip.data(evt).position(evt.pos).hidden(false);
        });

        lines.dispatch.on('elementMouseout.tooltip', function (evt) {
            tooltip.hidden(true)
        });

        //============================================================
        // Expose Public Variables
        //------------------------------------------------------------

        // expose chart's sub-components
        chartModel.dispatch = dispatch;
        chartModel.legend = legend;
        chartModel.lines = lines;
        chartModel.lines2 = lines2;
        chartModel.xAxis = xAxis;
        chartModel.yAxis = yAxis;
        chartModel.x2Axis = x2Axis;
        chartModel.y2Axis = y2Axis;
        chartModel.interactiveLayer = interactiveLayer;
        chartModel.tooltip = tooltip;

        chartModel.options = nv.utils.optionsFunc.bind(chartModel);

        chartModel._options = Object.create({}, {
            // simple options, just get/set the necessary values
            focusShowAxisY:    {get: function(){return focusShowAxisY;}, set: function(_){focusShowAxisY=_;}},
            width: {
                get: function () {
                    return width;
                }, set: function (_) {
                    width = _;
                }
            },
            height: {
                get: function () {
                    return height;
                }, set: function (_) {
                    height = _;
                }
            },
            focusHeight: {
                get: function () {
                    return height2;
                }, set: function (_) {
                    height2 = _;
                }
            },
            showLegend: {
                get: function () {
                    return showLegend;
                }, set: function (_) {
                    showLegend = _;
                }
            },
            brushExtent: {
                get: function () {
                    return brushExtent;
                }, set: function (_) {
                    brushExtent = _;
                }
            },
            defaultState: {
                get: function () {
                    return defaultState;
                }, set: function (_) {
                    defaultState = _;
                }
            },
            noData: {
                get: function () {
                    return noData;
                }, set: function (_) {
                    noData = _;
                }
            },

            // deprecated options
            tooltips: {
                get: function () {
                    return tooltip.enabled();
                }, set: function (_) {
                    // deprecated after 1.7.1
                    nv.deprecated('tooltips', 'use chart.tooltip.enabled() instead');
                    tooltip.enabled(!!_);
                }
            },
            tooltipContent: {
                get: function () {
                    return tooltip.contentGenerator();
                }, set: function (_) {
                    // deprecated after 1.7.1
                    nv.deprecated('tooltipContent', 'use chart.tooltip.contentGenerator() instead');
                    tooltip.contentGenerator(_);
                }
            },

            // options that require extra logic in the setter
            margin: {
                get: function () {
                    return margin;
                }, set: function (_) {
                    margin.top = _.top !== undefined ? _.top : margin.top;
                    margin.right = _.right !== undefined ? _.right : margin.right;
                    margin.bottom = _.bottom !== undefined ? _.bottom : margin.bottom;
                    margin.left = _.left !== undefined ? _.left : margin.left;
                }
            },
            color: {
                get: function () {
                    return color;
                }, set: function (_) {
                    color = nv.utils.getColor(_);
                    legend.color(color);
                    // line color is handled above?
                }
            },
            interpolate: {
                get: function () {
                    return lines.interpolate();
                }, set: function (_) {
                    lines.interpolate(_);
                    lines2.interpolate(_);
                }
            },
            xTickFormat: {
                get: function () {
                    return xAxis.tickFormat();
                }, set: function (_) {
                    xAxis.tickFormat(_);
                    x2Axis.tickFormat(_);
                }
            },
            yTickFormat: {
                get: function () {
                    return yAxis.tickFormat();
                }, set: function (_) {
                    yAxis.tickFormat(_);
                    y2Axis.tickFormat(_);
                }
            },
            duration: {
                get: function () {
                    return transitionDuration;
                }, set: function (_) {
                    transitionDuration = _;
                    yAxis.duration(transitionDuration);
                    y2Axis.duration(transitionDuration);
                    xAxis.duration(transitionDuration);
                    x2Axis.duration(transitionDuration);
                }
            },
            x: {
                get: function () {
                    return lines.x();
                }, set: function (_) {
                    lines.x(_);
                    lines2.x(_);
                }
            },
            y: {
                get: function () {
                    return lines.y();
                }, set: function (_) {
                    lines.y(_);
                    lines2.y(_);
                }
            },
            useInteractiveGuideline: {
                get: function () {
                    return useInteractiveGuideline;
                }, set: function (_) {
                    useInteractiveGuideline = _;
                    if (useInteractiveGuideline) {
                        lines.interactive(false);
                        lines.useVoronoi(false);
                    }
                }
            }
        });

        nv.utils.inheritOptions(chartModel, lines);
        nv.utils.initOptions(chartModel);

        //============================================================
        // Customize NVD3 Chart: Following code has been added by Juniper to
        // customize LineWithFocusChart.
        //------------------------------------------------------------

        chartModel.brushExtent(chartOptions['brushExtent'])
                  .useInteractiveGuideline(true);

        chartModel.interpolate(chUtils.interpolateSankey);

        chartModel.xAxis.tickFormat(function (d) {
            return d3.time.format('%H:%M:%S')(new Date(d));
        });

        chartModel.x2Axis.axisLabel("Time").tickFormat(function (d) {
            return d3.time.format('%H:%M:%S')(new Date(d));
        });

        chartModel.yAxis.axisLabel(chartOptions.yAxisLabel)
                        .axisLabelDistance(chartOptions.axisLabelDistance)
                        .tickFormat(chartOptions['yFormatter'])
                        .showMaxMin(false);

        if(contrail.checkIfExist(chartOptions.forceY)) {
            chartModel.lines.forceY(chartOptions.forceY);
            chartModel.lines2.forceY(chartOptions.forceY);
        }

        return chartModel;
    };

    return LineWithFocusChartModel;
});
/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */

define('core-basedir/js/views/LineWithFocusChartView',[
    'underscore',
    'contrail-view',
    'core-basedir/js/models/LineWithFocusChartModel',
    'contrail-list-model',
    'nv.d3'
], function (_, ContrailView, LineWithFocusChartModel, ContrailListModel,nv) {
    var LineWithFocusChartView = ContrailView.extend({
        render: function () {
            var viewConfig = this.attributes.viewConfig,
                ajaxConfig = viewConfig['ajaxConfig'],
                self = this, deferredObj = $.Deferred(),
                selector = $(self.$el),
                modelMap = contrail.handleIfNull(self.modelMap, {});

            if (contrail.checkIfExist(viewConfig.modelKey) && contrail.checkIfExist(modelMap[viewConfig.modelKey])) {
                self.model = modelMap[viewConfig.modelKey]
            }

            if (self.model === null && viewConfig['modelConfig'] !== null) {
                self.model = new ContrailListModel(viewConfig['modelConfig']);
            }

            self.renderChart(selector, viewConfig, self.model);

            if (self.model !== null) {
                if(self.model.loadedFromCache || !(self.model.isRequestInProgress())) {
                    self.renderChart(selector, viewConfig, self.model);
                }

                self.model.onAllRequestsComplete.subscribe(function() {
                    self.renderChart(selector, viewConfig, self.model);
                });

                if(viewConfig.loadChartInChunks) {
                    self.model.onDataUpdate.subscribe(function() {
                        self.renderChart(selector, viewConfig, self.model);
                    });
                }
            }
        },

        renderChart: function (selector, viewConfig, chartViewModel) {
            var self = this,
                modelData = chartViewModel.getItems(),
                data = modelData.slice(0),
                chartTemplate = contrail.getTemplate4Id(cowc.TMPL_CHART),
                widgetConfig = contrail.checkIfExist(viewConfig.widgetConfig) ? viewConfig.widgetConfig : null,
                chartViewConfig, chartOptions, chartModel;

            if (contrail.checkIfFunction(viewConfig['parseFn'])) {
                data = viewConfig['parseFn'](data);
            }

            chartViewConfig = getChartViewConfig(data, viewConfig);
            chartOptions = chartViewConfig['chartOptions'];
            chartModel = new LineWithFocusChartModel(chartOptions);

            chartModel.chartOptions = chartOptions;

            self.chartModel = chartModel;

            if ($(selector).find("svg") != null) {
                $(selector).empty();
            }

            $(selector).append(chartTemplate(chartOptions));

            //Store the chart object as a data attribute so that the chart can be updated dynamically
            $(selector).data('chart', chartModel);

            if (!($(selector).is(':visible'))) {
                $(selector).find('svg').bind("refresh", function () {
                    setData2Chart(self, chartViewConfig, chartViewModel, chartModel);
                });
            } else {
                setData2Chart(self, chartViewConfig, chartViewModel, chartModel);
            }

            nv.utils.windowResize(function () {
                chUtils.updateChartOnResize(selector, chartModel);
            });
            //Seems like in d3 chart renders with some delay so this deferred object helps in that situation,which resolves once the chart is rendered
            if (chartOptions['deferredObj'] != null)
                chartOptions['deferredObj'].resolve();

            if (widgetConfig !== null) {
                this.renderView4Config(selector.find('.chart-container'), chartViewModel, widgetConfig, null, null, null, function(){
                    chUtils.updateChartOnResize(selector, chartModel);
                });
            }
        },

        renderMessage: function(message, selector, chartOptions) {
            var self = this,
                message = contrail.handleIfNull(message, ""),
                selector = contrail.handleIfNull(selector, $(self.$el)),
                chartOptions = contrail.handleIfNull(chartOptions, self.chartModel.chartOptions),
                container = d3.select($(selector).find("svg")[0]),
                requestStateText = container.selectAll('.nv-requestState').data([message]),
                textPositionX = $(selector).width() / 2,
                textPositionY = chartOptions.margin.top + $(selector).find('.nv-focus').heightSVG() / 2 + 10;

            requestStateText
                .enter().append('text')
                .attr('class', 'nvd3 nv-requestState')
                .attr('dy', '-.7em')
                .style('text-anchor', 'middle');

            requestStateText
                .attr('x', textPositionX)
                .attr('y', textPositionY)
                .text(function(t){ return t; });

        },

        removeMessage: function(selector) {
            var self = this,
                selector = contrail.handleIfNull(selector, $(self.$el));

            $(selector).find('.nv-requestState').remove();
        }
    });

    function setData2Chart(self, chartViewConfig, chartViewModel, chartModel) {

        var chartData = chartViewConfig.chartData,
            checkEmptyDataCB = function (data) {
                return (!data || data.length === 0 || !data.filter(function (d) { return d.values.length; }).length);
            },
            chartDataRequestState = cowu.getRequestState4Model(chartViewModel, chartData, checkEmptyDataCB),
            chartDataObj = {
                data: chartData,
                requestState: chartDataRequestState
            },
            chartOptions = chartViewConfig['chartOptions'];

        d3.select($(self.$el)[0]).select('svg').datum(chartDataObj).call(chartModel);

        if (chartOptions.defaultDataStatusMessage) {
            var messageHandler = chartOptions.statusMessageHandler;
            self.renderMessage(messageHandler(chartDataRequestState));

        } else {
            self.removeMessage();
        }
    }

    function getChartViewConfig(chartData, viewConfig) {
        var chartViewConfig = {},
            chartOptions = ifNull(viewConfig['chartOptions'], {}),
            chartAxesOptionKey = contrail.checkIfExist(chartOptions.chartAxesOptionKey) ? chartOptions.chartAxesOptionKey : null,
            chartAxesOption = (contrail.checkIfExist(chartOptions.chartAxesOptions) && chartAxesOptionKey !== null)? chartOptions.chartAxesOptions[chartAxesOptionKey] : {};

        chartOptions = $.extend(true, {}, covdc.lineWithFocusChartConfig, chartOptions, chartAxesOption);

        chartOptions['forceY'] = getForceYAxis(chartData, chartOptions);

        if (chartData.length > 0) {
            spliceBorderPoints(chartData);
            var values = chartData[0].values,
                brushExtent = null,
                start, end;
            end = values[values.length - 1];
            if (values.length >= 20) {
                start = values[values.length - 20];
                chartOptions['brushExtent'] = [chUtils.getViewFinderPoint(start.x), chUtils.getViewFinderPoint(end.x)];
            } else if (chartOptions['defaultSelRange'] != null && 
                  values.length >= parseInt(chartOptions['defaultSelRange'])) {
                var selectionRange = parseInt(chartOptions['defaultSelRange']);
                start = values[values.length - selectionRange];
                chartOptions['brushExtent'] = [chUtils.getViewFinderPoint(start.x), chUtils.getViewFinderPoint(end.x)];
            }
        }

        chartViewConfig['chartData'] = chartData;
        chartViewConfig['chartOptions'] = chartOptions;

        return chartViewConfig;
    };

    function spliceBorderPoints(chartData) {
        var lineChart;
        for(var i = 0; i < chartData.length; i++) {
            lineChart = chartData[i];
            if (lineChart.length > 2) {
                lineChart['values'] = lineChart['values'].slice(1, -1);
            }
        }
    };

    function getForceYAxis(chartData, chartOptions) {
        var dataAllLines = [];

        for (var j = 0; j < chartData.length; j++) {
            dataAllLines = dataAllLines.concat(chartData[j]['values']);
        }

        if (contrail.checkIfExist(chartOptions.chartAxesOptions)) {
            $.each(chartOptions.chartAxesOptions, function(axisKey, axisValue) {
                var defaultForceY = axisValue['forceY'],
                    yAxisDataField = axisValue['yAxisDataField'];

                axisValue.forceY = cowu.getForceAxis4Chart(dataAllLines, yAxisDataField, defaultForceY);
            });
        }

        var defaultForceY = chartOptions['forceY'],
            yAxisDataField = contrail.checkIfExist(chartOptions['yAxisDataField']) ? chartOptions['yAxisDataField'] : 'y',
            forceY;

        forceY = cowu.getForceAxis4Chart(dataAllLines, yAxisDataField, defaultForceY);
        return forceY;
    };

    return LineWithFocusChartView;
});

/*
 * Copyright (c) 2015 Juniper Networks, Inc. All rights reserved.
 */

define('core-basedir/js/views/LoginWindowView',[
    'underscore',
    'contrail-view',
    'knockback'
], function (_, ContrailView, Knockback) {
    var prefixId = 'loginWindow';
    var modalId = 'loginWindowModal';
    var formId = '#' + modalId + '-form';

    var LoginWindowView = ContrailView.extend({
        renderLoginWindow: function (options) {
            var editTemplate =
                contrail.getTemplate4Id(ctwl.TMPL_CORE_GENERIC_EDIT);
            var editLayout = editTemplate({prefixId: prefixId, modalId: modalId}),
                self = this;

            cowu.createModal({'modalId': modalId, 'className': 'modal-420',
                             'title': 'Login', 'body': editLayout,
                             'onSave': function () {
                self.model.doLogin(options['data'],{
                    init: function () {
                        cowu.enableModalLoading(modalId);
                    },
                    success: function (response) {
                        options['callback'](response);
                        $("#" + modalId).modal('hide');
                    },
                    error: function (error) {
                        cowu.disableModalLoading(modalId, function () {
                            self.model.showErrorAttr(prefixId +
                                                     cowc.FORM_SUFFIX_ID,
                                                     error.responseText);
                        });
                    }
                });
            }, 'onCancel': function () {
                Knockback.release(self.model, document.getElementById(modalId));
                kbValidation.unbind(self);
                $("#" + modalId).modal('hide');
            }});

            self.renderView4Config($("#" + modalId).find(formId),
                    this.model,
                    getLoginWindowViewConfig(),
                    "loginValidations",
                    null,
                    null,
                    function() {
                        self.model.showErrorAttr(prefixId + cowc.FORM_SUFFIX_ID,
                                false);
                        Knockback.applyBindings(self.model, document.
                                getElementById(modalId));
                        kbValidation.bind(self);
                    }
            );
        },
    });

    function getLoginWindowViewConfig () {
//        var prefixId = ctwl.LINK_LOCAL_SERVICES_PREFIX_ID;
        var loginViewConfig = {
            elementId: cowu.formatElementId([prefixId, 'Login']),
            title: 'Login',
            view: "SectionView",
            viewConfig: {
                rows: [
                    {
                        columns: [
                            {
                                elementId: 'user_name',
                                view: 'FormInputView',
                                viewConfig: {
                                    path: 'user_name',
                                    class: 'span12',
                                    icon:'icon-cog',
                                    dataBindValue: 'user_name'
                                }
                            }
                        ]
                    },
                    {
                        columns :[
                            {
                                elementId: 'password',
                                view: 'FormInputView',
                                viewConfig: {
                                    path: 'password',
                                    type: 'password',
                                    class: 'span12',
                                    icon: 'icon-cog',
                                    dataBindValue: 'password',
                                }
                            }
                        ]
                    }
                ]
            }
        }
        return loginViewConfig;
    }

    return LoginWindowView;
});


/*
 * Copyright (c) 2015 Juniper Networks, Inc. All rights reserved.
 */

define('core-basedir/js/models/MultiBarChartModel',[
    'underscore'
], function (_) {
    /**
     * This chart model accepts data in following format:
     *  [{key: '', values: [{label: '', value: },{..}]},{..}]
     * @param chartOptions
     * @returns multiBarChartModel
     */
    var MultiBarChartModel = function (chartOptions) {
        var chartModel = nv.models.multiBarChart()
            .duration(chartOptions.transitionDuration)
            .height(chartOptions.height)
            .margin(chartOptions.margin)
            .x(function (d) {
                return d.label;
            })
            .y(function (d) {
                return d.value;
            })
            .tooltips(chartOptions.showTooltips)
            .reduceXTicks(chartOptions.reduceXTicks)
            .rotateLabels(chartOptions.rotateLabels)
            .color(function (d) {
                return chartOptions.barColor(d.key);
            })
            .showLegend(chartOptions.showLegend)
            .stacked(chartOptions.stacked)
            .showControls(chartOptions.showControls)
            .groupSpacing(chartOptions.groupSpacing);

        chartModel.legend.rightAlign(chartOptions.legendRightAlign)
            .padding(chartOptions.legendPadding);

        chartModel.xAxis.axisLabel(chartOptions.xAxisLabel);
        chartModel.xAxis.tickPadding(chartOptions.xAxisTickPadding);
        chartModel.yAxis.axisLabel(chartOptions.yAxisLabel).tickFormat(chartOptions.yFormatter);
        chartModel.yAxis.tickPadding(chartOptions.yAxisTickPadding);

        return chartModel;
    }
    return MultiBarChartModel;
});
/*
 * Copyright (c) 2015 Juniper Networks, Inc. All rights reserved.
 */

define('core-basedir/js/views/MultiBarChartView',[
    'underscore',
    'contrail-view',
    'core-basedir/js/models/MultiBarChartModel',
    'contrail-list-model',
    'nv.d3'
], function (_, ContrailView, MultiBarChartModel, ContrailListModel,nv) {
    var MultiBarChartView = ContrailView.extend({
        render: function () {
            var loadingSpinnerTemplate = contrail.getTemplate4Id(cowc.TMPL_LOADING_SPINNER),
                viewConfig = this.attributes.viewConfig,
                ajaxConfig = viewConfig['ajaxConfig'],
                self = this,
                selector = $(self.$el);

            $(selector).append(loadingSpinnerTemplate);

            if (viewConfig['modelConfig'] != null) {
                self.model = new ContrailListModel(viewConfig['modelConfig']);
                if (self.model.loadedFromCache || !(self.model.isRequestInProgress())) {
                    var chartData = self.model.getItems();
                    self.renderChart(selector, viewConfig, chartData);
                }

                self.model.onAllRequestsComplete.subscribe(function () {
                    var chartData = self.model.getItems();
                    self.renderChart(selector, viewConfig, chartData);
                });

                if (viewConfig.loadChartInChunks) {
                    self.model.onDataUpdate.subscribe(function () {
                        var chartData = self.model.getItems();
                        self.renderChart(selector, viewConfig, chartData);
                    });
                }
            }
        },

        renderChart: function (selector, viewConfig, data) {
            var chartViewConfig, chartModel, chartData, chartOptions;

            if (contrail.checkIfFunction(viewConfig['parseFn'])) {
                data = viewConfig['parseFn'](data);
            }

            chartOptions = ifNull(viewConfig['chartOptions'], {});

            chartViewConfig = getChartViewConfig(data, chartOptions);
            chartData = chartViewConfig['chartData'];
            chartOptions = chartViewConfig['chartOptions'];

            chartModel = new MultiBarChartModel(chartOptions);
            this.chartModel = chartModel;

            if ($(selector).find("svg") != null) {
                $(selector).empty();
            }

            $(selector).append("<svg style='height:" + chartOptions.height + "px;'></svg>");

            //Store the chart object as a data attribute so that the chart can be updated dynamically
            $(selector).data('chart', chartModel);

            if (!($(selector).is(':visible'))) {
                $(selector).find('svg').bind("refresh", function () {
                    d3.select($(selector)[0]).select('svg').datum(chartData).call(chartModel);
                });
            } else {
                d3.select($(selector)[0]).select('svg').datum(chartData).call(chartModel);
            }

            nv.utils.windowResize(function () {
                chUtils.updateChartOnResize(selector, chartModel);
            });

            if (chartOptions['deferredObj'] != null)
                chartOptions['deferredObj'].resolve();

            $(selector).find('.loading-spinner').remove();
        }
    });

    function getChartViewConfig(chartData, chartOptions) {
        var chartViewConfig = {};
        var chartDefaultOptions = {
            margin: {top: 10, right: 30, bottom: 20, left: 60},
            height: 250,
            xAxisLabel: 'Items',
            xAxisTickPadding: 10,
            yAxisLabel: 'Values',
            yAxisTickPadding: 5,
            yFormatter: function (d) {
                return cowu.addUnits2Bytes(d, false, false, 2);
            },
            showLegend: false,
            stacked: false,
            showControls: false,
            showTooltips: true,
            reduceXTicks: true,
            rotateLabels: 0,
            groupSpacing: 0.1,
            transitionDuration: 350,
            legendRightAlign: true,
            legendPadding: 32,
            barColor: d3.scale.category10()
        };
        var chartOptions = $.extend(true, {}, chartDefaultOptions, chartOptions);

        chartViewConfig['chartData'] = chartData;
        chartViewConfig['chartOptions'] = chartOptions;

        return chartViewConfig;
    };

    return MultiBarChartView;
});

/*
 * Copyright (c) 2015 Juniper Networks, Inc. All rights reserved.
 */

define('core-basedir/js/models/MultiDonutChartModel',[
    'underscore'
], function (_) {
    /**
     * This chart model accepts data in following format:
     *
     * @param chartOptions
     * @returns multiDonutChartModel
     * accepts value in {
            innerData: [{
                    name: "",
                    value: 0
                },.. ],
            outerData: [{

                    name: "",
                    value: 0
                },..]
        };
     */
    var MultiDonutChartModel = function (chartOptions) {

        chartOptions.width = ifNull(chartOptions.width, (200 - chartOptions.margin.left - chartOptions.margin.right));
        chartOptions.height = ifNull(chartOptions.height, (chartOptions.width - chartOptions.margin.top - chartOptions.margin.bottom));

        var multiDonutChart = function (selection) {

            selection.each(function (data) {

                var container = d3.select(this);
                container.classed({'contrail-svg': true});

                var containerWrap = container.selectAll("g.contrail-wrap.donut-chart").data([data]);
                var containerGEnter = containerWrap.enter()
                    .append("g")
                    .attr('class', 'contrail-svg contrail-wrap donut-chart').append('g')
                    .attr("transform", "translate(" + ((chartOptions.width / 2) + chartOptions.margin.left) + "," + ((chartOptions.height / 2) + chartOptions.margin.top) + ")");

                multiDonutChart.update = function () {
                    container.transition().call(multiDonutChart);
                };

                var radius = Math.min(chartOptions.width, chartOptions.height) / 2;

                var outerTooltip = nv.models.tooltip(),
                    innerTooltip = nv.models.tooltip();

                var outerArc = d3.svg.arc()
                    .outerRadius(radius)
                    .innerRadius(radius - 5);

                var innerArc = d3.svg.arc()
                    .outerRadius(radius - 7)
                    .innerRadius(radius - 20);

                var pie = d3.layout.pie()
                    .sort(null)
                    .startAngle(2 * Math.PI)
                    .endAngle(4 * Math.PI)
                    .value(function (d) {
                        return d.value;
                    });

                var outerPathGroup = containerGEnter.selectAll(".outer-arc")
                    .data(pie(data.outerData))
                    .enter().append("g")
                    .attr("class", "outer-arc")
                    .append("path")
                    .style("fill", function (d) {
                        d.data.color = chartOptions.outerArc.color(d.data.name);
                        return d.data.color;
                    })
                    .style("opacity", function (d) {
                        return chartOptions.outerArc.opacity;
                    })
                    .attr("d", outerArc)
                    .each(function (d) {
                        this._current = d;
                    }).on("mouseover", function (d) {
                        var content = chartOptions.outerArc.tooltipFn(d);
                        content.point = {};
                        content.point = null;
                        outerTooltip.position({top: d3.event.pageY, left: d3.event.pageX})();
                        outerTooltip.data(content).hidden(false);

                    }).on("mouseout", function (d) {
                        outerTooltip.hidden(true);
                    });

                var innerArcEnter = containerGEnter.selectAll(".inner-arc")
                    .data(pie(data.innerData))
                    .enter().append("g")
                    .attr("class", "inner-arc");

                var innerPathGroup = innerArcEnter.append("path")
                    .style("fill", function (d) {
                        d.data.color = chartOptions.innerArc.color(d.data.name);
                        return d.data.color;
                    })
                    .attr("d", innerArc)
                    .each(function (d) {
                        this._current = d;
                    }).on("mouseover", function (d) {
                        var content = chartOptions.innerArc.tooltipFn(d);
                        content.point = {};
                        content.point = null;
                        innerTooltip.position({top: d3.event.pageY, left: d3.event.pageX})();
                        innerTooltip.data(content).hidden(false);
                    }).on("mouseout", function (d) {
                        innerTooltip.hidden(true);
                    });

                var outerFlag = chartOptions.outerArc.flagKey;

                innerPathGroup.transition().duration(750).attrTween("d", innerArcTween);

                outerPathGroup.transition().duration(750)
                    .attrTween("d", outerArcTween)
                    .style("fill", function (d) {
                        return chartOptions.outerArc.color(d.data.status);
                    })
                    .style("stroke", function (d) {
                        if (d.data.status == outerFlag)
                            return chartOptions.outerArc.color(d.data.status);
                    })
                    .style("stroke-width", function (d) {
                        if (d.data.status == outerFlag)
                            return 1.5;
                    })
                    .style("opacity", function (d) {
                        if (d.data.status == outerFlag)
                            return 1;
                        else
                            return 0.5;
                    });

                function outerArcTween(a) {
                    var i = d3.interpolate(this._current, a);
                    this._current = i(0);
                    return function (t) {
                        return outerArc(i(t));
                    };
                }

                function innerArcTween(a) {
                    var i = d3.interpolate(this._current, a);
                    this._current = i(0);
                    return function (t) {
                        return innerArc(i(t));
                    };
                }
            });

        }

        return multiDonutChart;
    }
    return MultiDonutChartModel;
});
/*
 * Copyright (c) 2015 Juniper Networks, Inc. All rights reserved.
 */

define('core-basedir/js/views/MultiDonutChartView',[
    'underscore',
    'contrail-view',
    'core-basedir/js/models/MultiDonutChartModel',
    'contrail-list-model',
    'nv.d3'
], function (_, ContrailView, MultiDonutChartModel, ContrailListModel,nv) {
    var HorizontalBarChartView = ContrailView.extend({
        render: function () {
            var loadingSpinnerTemplate = contrail.getTemplate4Id(cowc.TMPL_LOADING_SPINNER),
                viewConfig = this.attributes.viewConfig,
                ajaxConfig = viewConfig['ajaxConfig'],
                self = this,
                selector = $(self.$el);

            $(selector).append(loadingSpinnerTemplate);

            if (self.model === null && viewConfig['modelConfig'] !== null) {
                self.model = new ContrailListModel(viewConfig['modelConfig']);
            }

            if (self.model !== null) {
                if (self.model.loadedFromCache || !(self.model.isRequestInProgress())) {
                    var chartData = self.model.getItems();
                    self.renderChart(selector, viewConfig, chartData);
                }

                self.model.onAllRequestsComplete.subscribe(function () {
                    var chartData = self.model.getItems();
                    self.renderChart(selector, viewConfig, chartData);
                });

                if (viewConfig.loadChartInChunks) {
                    self.model.onDataUpdate.subscribe(function () {
                        var chartData = self.model.getItems();
                        self.renderChart(selector, viewConfig, chartData);
                    });
                }
            }
        },

        renderChart: function (selector, viewConfig, data) {
            var chartViewConfig, chartModel, chartData, chartOptions, svgHeight;

            if (contrail.checkIfFunction(viewConfig['parseFn'])) {
                data = viewConfig['parseFn'](data);
            }

            chartOptions = ifNull(viewConfig['chartOptions'], {});

            chartViewConfig = getChartViewConfig(data, chartOptions);
            chartData = chartViewConfig['chartData'];
            chartOptions = chartViewConfig['chartOptions'];

            chartModel = new MultiDonutChartModel(chartOptions);
            this.chartModel = chartModel;

            svgHeight = chartOptions.height + 40;

            if ($(selector).find("svg") != null) {
                $(selector).empty();
            }

            $(selector).append("<svg style='height:" + svgHeight + "px;'></svg>");

            //Store the chart object as a data attribute so that the chart can be updated dynamically
            $(selector).data('chart', chartModel);

            if (!($(selector).is(':visible'))) {
                $(selector).find('svg').bind("refresh", function () {
                    d3.select($(selector)[0]).select('svg').datum(chartData).call(chartModel);
                });
            } else {
                d3.select($(selector)[0]).select('svg').datum(chartData).call(chartModel);
            }

            nv.utils.windowResize(function () {
                chUtils.updateChartOnResize(selector, chartModel);
            });

            if (chartOptions['deferredObj'] != null)
                chartOptions['deferredObj'].resolve();

            $(selector).find('.loading-spinner').remove();
        }
    });

    function getChartViewConfig(chartData, chartOptions) {
        var chartViewConfig = {};

        var chartDefaultOptions = {
            margin: {top: 20, right: 20, bottom: 20, left: 30},
            width: 150,
            height: 150,
            innerArc: {
                color: d3.scale.ordinal().range(["#1F77B4", "#C6DBEF", "#ADD6FB", "#6BAED6", "#D6EBFD", "#5DAEF8"]),
                opacity: 0,
                tooltipFn: function (d) {
                    return {
                        series: [{
                            key: d.data.name,
                            value: '',
                            color: d.data.color
                        }]
                    };
                }
            },
            outerArc: {
                color: d3.scale.ordinal().range(["#2CA02C", "#FF7F0E", "#D62728"]),
                opacity: 0.5,
                tooltipFn: function (d) {
                    return {
                        series: [{
                            key: d.data.name,
                            value: '',
                            color: d.data.color
                        }]
                    };
                },
                flagKey: 'Normal'
            },
            barColor: d3.scale.category10()
        };
        var chartDefaultData = {
            innerData: [{
                name: "used",
                value: 0
            }, {
                name: "available",
                value: 100
            }],
            outerData: [{
                name: "Normal",
                value: 75
            }, {
                name: "Warning",
                value: 15
            }, {
                name: "Critical",
                value: 10
            }]
        };

        var chartOptions = $.extend(true, {}, chartDefaultOptions, chartOptions);
        var chartData = $.extend(true, {}, chartDefaultData, chartData);

        chartViewConfig['chartData'] = chartData;
        chartViewConfig['chartOptions'] = chartOptions;

        return chartViewConfig;
    };

    return HorizontalBarChartView;
});

/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */

define('js/common/qe.utils',[
    'underscore'
], function (_) {
    var serializer = new XMLSerializer(),
        domParser = new DOMParser();

    var QEUtils = function () {
        var self = this;

        self.generateQueryUUID = function () {
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

        self.setUTCTimeObj = function (queryPrefix, formModelAttrs, serverCurrentTime, timeRange) {
            timeRange = (timeRange == null) ? getTimeRangeObj(formModelAttrs, serverCurrentTime) : timeRange;

            formModelAttrs['from_time_utc'] = timeRange.fromTime;
            formModelAttrs['to_time_utc'] = timeRange.toTime;
        };

        self.fetchServerCurrentTime = function(successCB) {
            var serverCurrentTime;

            $.ajax({
                url: '/api/service/networking/web-server-info'
            }).done(function (resultJSON) {
                serverCurrentTime = resultJSON['serverUTCTime'];
            }).always(function() {
                successCB(serverCurrentTime)
            });
        };

        self.getLabelStepUnit = function (tg, tgUnit) {
            var baseUnit = null, secInterval = 0;
            if (tgUnit == 'secs') {
                secInterval = tg;
                if (tg < 60) {
                    tg = (-1 * tg);
                } else {
                    tg = Math.floor(parseInt(tg / 60));
                }
                baseUnit = 'minutes';
            } else if (tgUnit == 'mins') {
                secInterval = tg * 60;
                baseUnit = 'minutes';
            } else if (tgUnit == 'hrs') {
                secInterval = tg * 3600;
                baseUnit = 'hours';
            } else if (tgUnit == 'days') {
                secInterval = tg * 86400;
                baseUnit = 'days';
            }
            return {labelStep: (1 * tg), baseUnit: baseUnit, secInterval: secInterval};
        };

        self.getEngQueryStr = function (reqQueryObj) {
            var engQueryJSON = {
                select: reqQueryObj.select,
                from: reqQueryObj.table_name,
                where: reqQueryObj.where,
                filter: reqQueryObj.filters,
                direction: reqQueryObj.direction
            };
            if (reqQueryObj.toTimeUTC == "now") {
                engQueryJSON['from_time'] = reqQueryObj.from_time;
                engQueryJSON['to_time'] = reqQueryObj.to_time;
            } else {
                engQueryJSON['from_time'] = moment(reqQueryObj.from_time_utc).format('MMM DD, YYYY hh:mm:ss A');
                engQueryJSON['to_time'] = moment(reqQueryObj.to_time_utc).format('MMM DD, YYYY hh:mm:ss A');
            }

            return JSON.stringify(engQueryJSON);
        };

        self.formatEngQuery = function(enqQueryObjStr) {
            var engQueryObj = JSON.parse(enqQueryObjStr),
                engQueryStr = '';

            $.each(engQueryObj, function(key, val){
                if(key == 'select' && (!contrail.checkIfExist(val) || val == "")){
                    engQueryStr += '<div class="row-fluid"><span class="bolder">' + key.toUpperCase() + '</span> &nbsp;*</div>';
                } else if((key == 'where' || key == 'filter') && (!contrail.checkIfExist(val) || val == "")){
                    engQueryStr += '';
                } else {
                    var formattedKey = key;
                    if(key == 'from_time' || key == 'to_time'){
                        formattedKey = key.split('_').join(' ');
                    }
                    engQueryStr += '<div class="row-fluid word-break-normal"><span class="bolder">' + formattedKey.toUpperCase() + '</span> &nbsp;' + val + '</div>';
                }
            });
            return engQueryStr;
        };

        self.adjustHeight4FormTextarea = function(elId) {
            var texareaNames = ['select', 'where', 'filters'];

            $.each(texareaNames, function(nameKey, nameValue) {
                $(elId).find('[name="' + nameValue + '"]')
                    .height(0)
                    .height($(elId).find('[name="' + nameValue + '"]').get(0).scrollHeight - 5);
            });
        };

        self.getFromTimeElementConfig = function(fromTimeId, toTimeId) {
            return {
                formatTime: 'h:i A',
                format: 'M d, Y h:i A',
                displayFormat: 'MMM DD, YYYY hh:mm A',
                onShow: function(cdt) {
                    this.setOptions(getFromTimeShowOptions(toTimeId, cdt));
                },
                onClose: function(cdt) {
                    this.setOptions(getFromTimeShowOptions(toTimeId, cdt));
                },
                onSelectDate: function(cdt) {
                    this.setOptions(getFromTimeSelectOptions(toTimeId, cdt));
                }
            };
        };

        self.getToTimeElementConfig = function(fromTimeId, toTimeId) {
            return {
                formatTime: 'h:i A',
                format: 'M d, Y h:i A',
                displayFormat: 'MMM DD, YYYY hh:mm A',
                onShow: function(cdt) {
                    this.setOptions(getToTimeShowOptions(fromTimeId, cdt));
                },
                onClose: function(cdt) {
                    this.setOptions(getToTimeShowOptions(fromTimeId, cdt));
                },
                onSelectDate: function(cdt) {
                    this.setOptions(getToTimeSelectOptions(fromTimeId, cdt));
                }
            };
        };

        self.getModalClass4Table = function(tableName) {
            switch (tableName) {
                case "StatTable.ServerMonitoringSummary.resource_info_stats":
                    return "modal-1120";

                case "StatTable.ServerMonitoringInfo.file_system_view_stats.physical_disks":
                    return "modal-1120";

                default:
                    return cowc.QE_DEFAULT_MODAL_CLASSNAME;
            }
        };

        self.formatTimeRange = function(timeRange) {
            var formattedTime = 'custom', timeInSecs;
            if(timeRange != null && timeRange != -1) {
                timeInSecs = parseInt(timeRange);
                if(timeInSecs <= 3600) {
                    formattedTime = 'Last ' + timeInSecs/60 + ' mins';
                } else if ( timeInSecs <= 43200) {
                    formattedTime = 'Last ' + timeInSecs/3600 + ' hrs';
                }
            }
            return formattedTime;
        };

        //TODO- remove this
        self.addFlowMissingPoints = function(tsData, options, plotFields, color, counter) {
            var fromTime = options.fromTime,
                toTime = options.toTime,
                interval = options.interval * 1000,
                plotData = [], addPoint, flowClassId = null,
                sumBytes = [], sumPackets = [];

            for (var key in tsData) {
                if (tsData[key]['flow_class_id'] != null) {
                    flowClassId = tsData[key]['flow_class_id'];
                    break;
                }
            }

            for (var i = fromTime + interval; i <= toTime; i += interval) {
                for (var k = 0; k < plotFields.length; k++) {
                    addPoint = {'x':i, 'flow_class_id':flowClassId};
                    if (tsData[i.toString()] != null) {
                        addPoint['y'] = tsData[i.toString()][plotFields[k]];
                    } else {
                        addPoint['y'] = 0;
                    }
                    if(plotFields[k] == 'sum_bytes') {
                        sumBytes.push(addPoint);
                    } else if (plotFields[k] == 'sum_packets') {
                        sumPackets.push(addPoint);
                    }
                }
            }

            if(sumBytes.length > 0) {
                plotData.push({'key': "#" + counter + ': Sum Bytes', color: color, values: sumBytes});
            } else if(sumPackets.length > 0) {
                plotData.push({'key': "#" + counter + ': Sum Packets', color: color, values: sumPackets});
            }

            return plotData;
        };

        self.getCurrentTime4Client = function() {
            var now = new Date(), currentTime;
            currentTime = now.getTime();
            return currentTime;
        };

        self.addChartMissingPoints = function(chartDataRow, queryFormAttributes, plotFields) {
            var chartDataValues = chartDataRow.values,
                newChartDataValues = {},
                emptyChartDataValue  = {},
                timeGranularity = queryFormAttributes.time_granularity,
                timeGranularityUnit = queryFormAttributes.time_granularity_unit,
                timeInterval = timeGranularity * cowc.TIME_GRANULARITY_INTERVAL_VALUES[timeGranularityUnit],
                toTime = queryFormAttributes.to_time_utc,
                fromTime = queryFormAttributes.from_time_utc;

            $.each(plotFields, function(plotFieldKey, plotFieldValue) {
                emptyChartDataValue[plotFieldValue] = 0;
            });

            for (var i = fromTime; i < toTime; i += timeInterval) {
                if (!contrail.checkIfExist(chartDataValues[i])) {
                    newChartDataValues[i] = emptyChartDataValue
                } else {
                    newChartDataValues[i] = chartDataValues[i];
                }
            }

            chartDataRow.values = newChartDataValues;

            return chartDataRow;
        };

        self.parseWhereCollection2String = function(queryFormModel) {
            var whereOrClauses = queryFormModel.model().get('where_or_clauses'),
                whereOrClauseStrArr = [];

            $.each(whereOrClauses.models, function(whereOrClauseKey, whereOrClauseValue) {
                if (whereOrClauseValue.attributes.orClauseText !== '') {
                    whereOrClauseStrArr.push('(' + whereOrClauseValue.attributes.orClauseText + ')')
                }
            });

            return whereOrClauseStrArr.join(' OR ');
        };

        self.parseFilterCollection2String = function (queryFormModel) {
            var filterAndClauses = queryFormModel.model().attributes['filter_and_clauses'],
                sort_by = queryFormModel.model().attributes['sort_by'],
                sort_order = queryFormModel.model().attributes['sort_order'],
                limit = queryFormModel.model().attributes['limit'],
                filterAndClausestrArr = [], filterAndClausestr = '';

            $.each(filterAndClauses.models, function (filterAndClauseKey, filterAndClauseValue) {
                var name, value, operator;
                name = filterAndClauseValue.attributes.name;
                operator = filterAndClauseValue.attributes.operator;
                value = filterAndClauseValue.attributes.value();

                if (name !== '' && operator !== '' && value !== '') {
                    filterAndClausestrArr.push(name + ' ' + operator + ' ' + value);
                }
            });

            if (filterAndClausestrArr.length > 0) {
                filterAndClausestr = filterAndClausestr.concat("filter: ");
                filterAndClausestr = filterAndClausestr.concat(filterAndClausestrArr.join(' AND '));
            }
            if (contrail.checkIfExist(limit)) {
                if(filterAndClausestr !== '') {
                    filterAndClausestr = filterAndClausestr.concat(" & limit: " + limit);
                } else {
                    filterAndClausestr = filterAndClausestr.concat("limit: " + limit);
                }
            }
            if (contrail.checkIfExist(sort_by)) {
                if(filterAndClausestr !== '') {
                    filterAndClausestr = filterAndClausestr.concat(" & sort_fields: " + sort_by);
                } else {
                    filterAndClausestr = filterAndClausestr.concat("sort_fields: " + sort_by);
                }
            }
            if (contrail.checkIfExist(sort_order)) {
                if(filterAndClausestr !== '') {
                    filterAndClausestr = filterAndClausestr.concat(" & sort: " + sort_order);
                } else {
                    filterAndClausestr = filterAndClausestr.concat("sort: " + sort_order);
                }
            }
            return filterAndClausestr;
        };

        self.parseWhereCollection2JSON = function(queryFormModel) {
            var whereOrClauses = queryFormModel.model().get('where_or_clauses'),
                whereOrJSONArr = [];

            $.each(whereOrClauses.models, function(whereOrClauseKey, whereOrClauseValue) {
                if (whereOrClauseValue.attributes.orClauseText !== '') {
                    whereOrJSONArr.push(parseWhereANDClause('(' + whereOrClauseValue.attributes.orClauseText + ')'));
                }
            });

            return whereOrJSONArr;
        };

        self.parseSelectString2Array = function(queryFormModel) {
            var selectString = queryFormModel.select(),
                selectArray = (selectString == null || selectString.trim() == '') ? [] : selectString.split(', ');

            queryFormModel.select_data_object().checked_fields(selectArray)
        };

        self.parseWhereString2Collection = function(queryFormModel) {
            queryFormModel.where_json(self.parseWhereString2JSON(queryFormModel));
            qewu.parseWhereJSON2Collection(queryFormModel)
        };

        self.parseFilterString2Collection = function(queryFormModel) {
            queryFormModel.filter_json(self.parseFilterString2JSON(queryFormModel));
            qewu.parseFilterJSON2Collection(queryFormModel);
        };

        self.parseWhereJSON2Collection = function(queryFormModel) {
            var whereStr = queryFormModel.model().get('where'),
                whereOrClauseStrArr = (whereStr == null) ? [] : whereStr.split(' OR '),
                whereOrJSON = queryFormModel.model().get('where_json'),
                wherOrClauseObjects = [];

            queryFormModel.model().get('where_or_clauses').reset();

            $.each(whereOrJSON, function(whereOrJSONKey, whereOrJSONValue) {
                wherOrClauseObjects.push({orClauseText: whereOrClauseStrArr[whereOrJSONKey], orClauseJSON: whereOrJSONValue});
            });

            queryFormModel.addNewOrClauses(wherOrClauseObjects);
        };

        self.parseFilterJSON2Collection = function(queryFormModel) {
            var filterStr = queryFormModel.model().attributes.filters,
                filterOrJSON = queryFormModel.model().attributes.filter_json;

            queryFormModel.model().get('filter_and_clauses').reset();
            queryFormModel.addNewFilterAndClause(filterOrJSON);
        };

        self.parseWhereString2JSON = function(queryFormModel) {
            var whereStr = queryFormModel.model().get('where'),
                whereOrClauseStrArr = (whereStr == null) ? [] : whereStr.split(' OR '),
                whereOrJSONArr = [];

            $.each(whereOrClauseStrArr, function(whereOrClauseStrKey, whereOrClauseStrValue) {
                if (whereOrClauseStrValue != '') {
                    whereOrJSONArr.push(parseWhereANDClause(whereOrClauseStrValue));
                }
            });

            return whereOrJSONArr;
        };

        self.parseFilterString2JSON = function(queryFormModel) {
            var filtersStr = queryFormModel.model().attributes.filters;
            return parseFilterANDClause(filtersStr);
        };

         self.getAggregateSelectFields = function(selectArray) {
            var aggregateSelectArray = [];

            $.each(selectArray, function(selectKey, selectValue) {
                if (self.isAggregateField(selectValue)) {
                    aggregateSelectArray.push(selectValue);
                }
            });

            return aggregateSelectArray
        };

        self.getNameSuffixKey = function(name, nameOptionList) {
            var nameSuffixKey = -1;

            $.each(nameOptionList, function(nameOptionKey, nameOptionValue) {
                if(nameOptionValue.name === name) {
                    nameSuffixKey = (nameOptionValue.suffixes === null) ? -1 : nameOptionKey;
                    return false;
                }
            });

            return nameSuffixKey;
        };

        self.isAggregateField = function(fieldName) {
            var fieldNameLower = fieldName.toLowerCase(),
                isAggregate = false;

            var AGGREGATE_PREFIX_ARRAY = ['min(', 'max(', 'count(', 'sum('];

            for (var i = 0; i < AGGREGATE_PREFIX_ARRAY.length; i++) {
                if(fieldNameLower.indexOf(AGGREGATE_PREFIX_ARRAY[i]) != -1) {
                    isAggregate = true;
                    break;
                }
            }

            return isAggregate;
        };

        //TODO - Delete this
        self.formatXML2JSON = function(xmlString, is4SystemLogs) {
            console.warn(cowm.DEPRECATION_WARNING_PREFIX + 'Function formatXML2JSON of qe-utils is deprecated. Use formatXML2JSON() of core-utils instead.');

            if (xmlString && xmlString != '') {
                var xmlDoc = filterXML(xmlString, is4SystemLogs);
                return convertXML2JSON(serializer.serializeToString(xmlDoc));
            } else {
                return '';
            }
        };

        self.getLevelName4Value = function(logValue) {
            var count = cowc.QE_LOG_LEVELS.length;
            for (var i = 0; i < count; i++) {
                if (cowc.QE_LOG_LEVELS[i].value == logValue) {
                    return cowc.QE_LOG_LEVELS[i].name;
                }
            }
            return logValue;
        };

        /**
         * Pass either selectedFlowRecord or formModel attribute to check if session analyzer can be enabled.
         * @param selectedFlowRecord
         * @param formModelAttr
         * @returns {boolean}
         */
        self.enableSessionAnalyzer = function(selectedFlowRecord, formModelAttr) {
            var enable = true, disable = !enable,
                keys = ['vrouter', 'sourcevn', 'sourceip', 'destvn', 'destip', 'sport', 'dport'];
            if (contrail.checkIfExist(selectedFlowRecord)) {
                for (var i = 0; i < keys.length; i++) {
                    if (!(selectedFlowRecord.hasOwnProperty(keys[i]) && (selectedFlowRecord[keys[i]] != null))) {
                        return disable;
                    }
                }
            }
            if (contrail.checkIfExist(formModelAttr)) {
                var selectArray = formModelAttr.select.split(', ');
                for (var i = 0; i < keys.length; i++) {
                    if (selectArray.indexOf(keys[i]) == -1) {
                        return disable;
                    }
                }
            }
            return enable;
        };
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

    function convertXML2JSON(xmlString) {
        return $.xml2json(xmlString);
    };

    function getTimeRangeObj(formModelAttrs, serverCurrentTime) {
        var timeRange = formModelAttrs['time_range'],
            fromDate, toDate, fromTimeUTC, toTimeUTC, serverDateObj,
            fromTime, toTime, now


        if (timeRange > 0) {
            if (serverCurrentTime) {
                serverDateObj =  new Date(serverCurrentTime);
                serverDateObj.setSeconds(0);
                serverDateObj.setMilliseconds(0);
                toTimeUTC = serverDateObj.getTime();
            } else {
                now = new Date();
                now.setSeconds(0);
                now.setMilliseconds(0);
                toTimeUTC = now.getTime();
            }
            fromTimeUTC = toTimeUTC - (timeRange * 1000);
            toTime = toTimeUTC;
            fromTime = fromTimeUTC;
        } else {
            // Used for custom time range
            fromDate = formModelAttrs['from_time'];
            fromTimeUTC = roundDate2Minutes(new Date(fromDate)).getTime();
            fromTime = fromTimeUTC;
            toDate = formModelAttrs['to_time'];
            toTimeUTC = roundDate2Minutes(new Date(toDate)).getTime();
            toTime = toTimeUTC;
        }

        return {fromTime: fromTime, toTime: toTime};
    };

    function roundDate2Minutes(dateObj) {
        dateObj.setSeconds(0);
        dateObj.setMilliseconds(0);
        return dateObj;
    }

    function getTGMicroSecs(tg, tgUnit) {
        if (tgUnit == 'secs') {
            return tg * 1000;
        } else if (tgUnit == 'mins') {
            return tg * 60 * 1000;
        } else if (tgUnit == 'hrs') {
            return tg * 3600 * 1000;
        } else if (tgUnit == 'days') {
            return tg * 86400 * 1000;
        }
    };

    function ceilFromTime(fromTimeUTC, TGSecs){
        fromTimeUTC = TGSecs * Math.ceil(fromTimeUTC/TGSecs);
        return fromTimeUTC;
    };

    function getFromTimeShowOptions(toTimeId, cdt) {
        var d = new Date($('#' + toTimeId + '_datetimepicker').val()),
            dateString = moment(d).format('MMM DD, YYYY'),
            timeString = moment(d).format('hh:mm:ss A');

        return {
            maxDate: dateString ? dateString : false,
            maxTime: timeString ? timeString : false
        };
    };

    function getFromTimeSelectOptions(toTimeId, cdt) {
        var d = new Date($('#' + toTimeId + '_datetimepicker').val()),
            toDateString = moment(d).format('MMM DD, YYYY'),
            timeString = moment(d).format('hh:mm:ss A'),
            fromDateString = moment(cdt).format('MMM DD, YYYY');

        return {
            maxDate: toDateString ? toDateString : false,
            maxTime: (fromDateString == toDateString) ? timeString : false
        };
    };

    function getToTimeShowOptions(fromTimeId, cdt) {
        var d = new Date($('#' + fromTimeId + '_datetimepicker').val()),
            dateString = moment(d).format('MMM DD, YYYY'),
            timeString = moment(d).format('hh:mm:ss A');

        return {
            minDate: dateString ? dateString : false,
            minTime: timeString ? timeString : false
        };
    };

    function getToTimeSelectOptions(fromTimeId, cdt) {
        var d = new Date($('#' + fromTimeId + '_datetimepicker').val()),
            fromDateString = moment(d).format('MMM dd, yyyy'),
            timeString = moment(d).format('hh:mm:ss A'),
            toDateString = moment(cdt).format('MMM DD, YYYY');

        return {
            minDate: fromDateString ? fromDateString : false,
            minTime: (toDateString == fromDateString) ? timeString : false
        };
    };

    function parseFilterANDClause(filters) {
        if (!contrail.checkIfExist(filters)){
            // make filters empty string to prevent parse error when opened first time
            filters = "";
        }
        var filtersArray = cowu.splitString2Array(filters, "&"),
            filter, filterBy, limitBy, sortFields, sortOrder,
            filter_json_obj = {};

        for (var i = 0; i < filtersArray.length; i++) {
            filter = filtersArray[i];
            if(filter.indexOf('filter:') != -1) {
                filterBy = cowu.splitString2Array(filter, "filter:")[1];
                if(filterBy.length > 0) {
                    filter_json_obj["filter"] = parseFilterBy(filterBy);
                }
            } else if (filter.indexOf('limit:') != -1) {
                limitBy = cowu.splitString2Array(filter, "limit:")[1];
                if(limitBy.length > 0) {
                    filter_json_obj["limit"] = parseLimitBy(limitBy);
                }
            } else if (filter.indexOf('sort_fields:') != -1) {
                sortFields = cowu.splitString2Array(filter, "sort_fields:")[1];
                if(sortFields.length > 0) {
                    filter_json_obj["sort_fields"] = parseSortFields(sortFields);
                }
            } else if (filter.indexOf('sort:') != -1) {
                sortOrder = cowu.splitString2Array(filter, "sort:")[1];
                if(sortOrder.length > 0) {
                    filter_json_obj["sort_order"] = sortOrder;
                }
            }
        }
        return filter_json_obj;
    };

    function parseFilterBy(filterBy) {
        var filtersArray, filtersLength, filterClause = [], i, filterObj;
        if (filterBy != null && filterBy.trim() != '') {
            filtersArray = filterBy.split(' AND ');
            filtersLength = filtersArray.length;
            for (i = 0; i < filtersLength; i += 1) {
                filtersArray[i] = filtersArray[i].trim();
                filterObj = getFilterObj(filtersArray[i]);
                filterClause.push(filterObj);
            }
            return filterClause;
        }
    };

    function getFilterObj(filter) {
        var filterObj;
        if (filter.indexOf('!=') != -1) {
            filterObj = parseFilterObj(filter, '!=');
        } else if (filter.indexOf(" RegEx= ") != -1) {
            filterObj = parseFilterObj(filter, 'RegEx=');
        } else if (filter.indexOf("=") != -1) {
            filterObj = parseFilterObj(filter, '=');
        }
        return filterObj;
    };

    function parseFilterObj(filter, operator) {
        var filterObj, filterArray;
        filterArray = cowu.splitString2Array(filter, operator);
        if (filterArray.length > 1 && filterArray[1] != '') {
            filterObj = {"name": "", value: "", op: ""};
            filterObj.name = filterArray[0];
            filterObj.value = filterArray[1];
            filterObj.op = getOperatorCode(operator);
        }
        return filterObj
    };

    function parseLimitBy(limitBy) {
        try {
            var parsedLimit = parseInt(limitBy);
            return parsedLimit;
        } catch (error) {
            logutils.logger.error(error.stack);
        }
    };

    function parseSortFields(sortFields){
        var sortFieldsArr = sort_fields.split(',');
        for(var i=0; i< sortFieldsArr.length; i++) {
            sortFieldsArr[i] = sortFieldsArr[i].trim();
        }
        return  sortFieldsArr;
    };

    function parseWhereANDClause(whereANDClause) {
        var whereANDArray = whereANDClause.replace('(', '').replace(')', '').split(' AND '),
            whereANDLength = whereANDArray.length, i, whereANDClause, whereANDClauseArray, operator = '';
        for (i = 0; i < whereANDLength; i += 1) {
            whereANDArray[i] = whereANDArray[i].trim();
            whereANDClause = whereANDArray[i];
            if (whereANDClause.indexOf('&') == -1) {
                if (whereANDClause.indexOf('Starts with') != -1) {
                    operator = 'Starts with';
                    whereANDClauseArray = whereANDClause.split(operator);
                } else if (whereANDClause.indexOf('=') != -1) {
                    operator = '=';
                    whereANDClauseArray = whereANDClause.split(operator);
                }
                whereANDClause = {"name": "", value: "", op: ""};
                populateWhereANDClause(whereANDClause, whereANDClauseArray[0].trim(), whereANDClauseArray[1].trim(), operator);
                whereANDArray[i] = whereANDClause;
            } else {
                var whereANDClauseWithSuffixArrray = whereANDClause.split('&'),
                    whereANDTerm = '';
                // Treat whereANDClauseWithSuffixArrray[0] as a normal AND term and
                // whereANDClauseWithSuffixArrray[1] as a special suffix term
                if (whereANDClauseWithSuffixArrray != null && whereANDClauseWithSuffixArrray.length != 0) {
                    var tempWhereANDClauseWithSuffix;
                    for (var j = 0; j < whereANDClauseWithSuffixArrray.length; j++) {
                        if (whereANDClauseWithSuffixArrray[j].indexOf('Starts with') != -1) {
                            operator = 'Starts with';
                            whereANDTerm = whereANDClauseWithSuffixArrray[j].split(operator);
                        } else if (whereANDClauseWithSuffixArrray[j].indexOf('=') != -1) {
                            operator = '=';
                            whereANDTerm = whereANDClauseWithSuffixArrray[j].split(operator);
                        }
                        whereANDClause = {"name": "", value: "", op: ""};
                        populateWhereANDClause(whereANDClause, whereANDTerm[0].trim(), whereANDTerm[1].trim(), operator);
                        if (j == 0) {
                            tempWhereANDClauseWithSuffix = whereANDClause;
                        } else if (j == 1) {
                            tempWhereANDClauseWithSuffix.suffix = whereANDClause;
                        }
                    }
                    whereANDArray[i] = tempWhereANDClauseWithSuffix;
                }
            }
        }
        return whereANDArray;
    };

    function populateWhereANDClause(whereANDClause, fieldName, fieldValue, operator) {
        var validLikeOPRFields = ['sourcevn', 'destvn'],
            validRangeOPRFields = ['protocol', 'sourceip', 'destip', 'sport', 'dport'],
            splitFieldValues;
        whereANDClause.name = fieldName;
        if (validLikeOPRFields.indexOf(fieldName) != -1 && fieldValue.indexOf('*') != -1) {
            whereANDClause.value = fieldValue.replace('*', '');
            whereANDClause.op = 7;
        } else if (validRangeOPRFields.indexOf(fieldName) != -1 && fieldValue.indexOf('-') != -1) {
            splitFieldValues = cowu.splitString2Array(fieldValue, '-');
            whereANDClause.value = splitFieldValues[0];
            whereANDClause['value2'] = splitFieldValues[1];
            whereANDClause.op = 3;
        } else {
            whereANDClause.value = fieldValue;
            whereANDClause.op = getOperatorCode(operator);
        }
    };

    function getOperatorCode(operator) {
        var operatorCode = -1;

        $.each(cowc.OPERATOR_CODES, function(operatorCodeKey, operatorCodeValue) {
            if(operator === operatorCodeValue) {
                operatorCode = operatorCodeKey;
                return false;
            }
        });

        return operatorCode;
    };

    return new QEUtils();
});

/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */

define('query-form-view',[
    'underscore',
    'contrail-view',
    'knockback',
    'js/common/qe.utils'
], function (_, ContrailView, Knockback,qewu) {

    var QueryFormView = ContrailView.extend({

        renderSelect: function (options) {
            qewu.parseSelectString2Array(this.model);
            this.renderView4Config(this.$el, this.model, getSelectViewConfig(contrail.checkIfExist(options) ? options : {}));
        },

        renderWhere: function (options) {
            qewu.parseWhereString2Collection(this.model);
            this.model.addNewOrClauses([{}]);
            this.renderView4Config(this.$el, this.model, getWhereViewConfig(contrail.checkIfExist(options) ? options : {}));
        },

        renderFilters: function (options) {
            // need to parseSelectString as filter is dependent on select
            qewu.parseSelectString2Array(this.model);
            qewu.parseFilterString2Collection(this.model);
            this.renderView4Config(this.$el, this.model, getFilterViewConfig(contrail.checkIfExist(options) ? options : {}));
            this.model.addFilterAndClause([]);
        }
    });

    function getSelectViewConfig(options) {
        return {
            view: "QuerySelectView",
            viewConfig: {
                className: contrail.checkIfExist(options.className) ? options.className : cowc.QE_DEFAULT_MODAL_CLASSNAME
            }
        };
    };

    function getWhereViewConfig(options) {
        return {
            view: "QueryWhereView",
            viewConfig: {
                className: contrail.checkIfExist(options.className) ? options.className : cowc.QE_DEFAULT_MODAL_CLASSNAME
            }
        };
    };

    function getFilterViewConfig(options) {
        return {
            view: "QueryFilterView",
            viewConfig: {
                className: contrail.checkIfExist(options.className) ? options.className : cowc.QE_DEFAULT_MODAL_CLASSNAME
            }
        };
    };

    return QueryFormView;
});

/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */

define('query-and-model',[
    'underscore',
    'backbone',
    'knockout',
    'contrail-model'
], function (_, Backbone, Knockout, ContrailModel) {
    var QueryAndModel = ContrailModel.extend({

        defaultConfig: {
            name: '',
            operator: '=',
            value : '',
            suffix_name: '',
            suffix_operator: '=',
            suffix_value : ''
        },

        constructor: function (parentModel, modelData) {
            this.parentModel = parentModel;
            ContrailModel.prototype.constructor.call(this, modelData);
            return this;
        },

        validateAttr: function (attributePath, validation, data) {
            var model = data.model().attributes.model(),
                attr = cowu.getAttributeFromPath(attributePath),
                errors = model.get(cowc.KEY_MODEL_ERRORS),
                attrErrorObj = {}, isValid;

            isValid = model.isValid(attributePath, validation);

            attrErrorObj[attr + cowc.ERROR_SUFFIX_ID] = (isValid == true) ? false : isValid;
            errors.set(attrErrorObj);
        },

        addAndClauseAtIndex: function() {
            var self = this,
                andClauses = this.model().collection,
                andClause = this.model(),
                andClauseIndex = _.indexOf(andClauses.models, andClause),
                newAndClause = new QueryAndModel(self.parentModel(), {});

            andClauses.add(newAndClause, {at: andClauseIndex + 1});
        },

        deleteWhereAndClause: function() {
            var andClauses = this.model().collection,
                andClause = this.model();

            if (andClauses.length > 1) {
                andClauses.remove(andClause);
            }
        },

        getNameOptionList: function(viewModel) {
            var rootModel = viewModel.parentModel().parentModel.model(),
                whereDataObject = rootModel.get('where_data_object');

            return $.map(whereDataObject['name_option_list'], function(schemaValue, schemaKey) {
                if(schemaValue.index) {
                    return {id: schemaValue.name, text: schemaValue.name};
                }
            });
        },

        getFilterNameOptionList: function(viewModel) {
            var rootModel = viewModel.parentModel(),
                validFilterFields = rootModel.select_data_object.checked_fields(),
                resultFilterFieldsDataArr = [], invalidFilterFieldsArr = ["T=", "T", "UUID"];

            for (var i = 0; i < validFilterFields.length; i++) {
                if (invalidFilterFieldsArr.indexOf(validFilterFields[i]) === -1) {
                    resultFilterFieldsDataArr.push({id: validFilterFields[i], text: validFilterFields[i]});
                }
            }
            return resultFilterFieldsDataArr;
        },

        getFilterOperatorOptionList: function (viewModel){
            var rootModel = viewModel.parentModel(),
                name = (contrail.checkIfExist(viewModel.name())) ? viewModel.name() : "",
                tableColumnsMap = viewModel.parentModel().ui_added_parameters.table_schema_column_names_map,
                matchedColumnObj = tableColumnsMap[name],
                resultOperatorArr = [{id: '=', text: '='}, {id: '!=', text: '!='}];

            if (!(_.isEmpty(matchedColumnObj))) {
                // if column type = integer/double      => LEQ, GEQ
                if(matchedColumnObj.datatype == "int" || matchedColumnObj.dataType == "double"){
                    resultOperatorArr.push({id: '<=', text: '<='});
                    resultOperatorArr.push({id: '>=', text: '>='});
                }
                // if column type = string              => RegEx allowed
                if(matchedColumnObj.datatype == "string"){
                    resultOperatorArr.push({id: 'RegEx=', text: 'RegEx='});
                }
            }
            return resultOperatorArr;
        },

        getFilterValueOptionList: function(viewModel) {
            var rootModel = viewModel.parentModel(),
                name = viewModel.name(),
                // use the where_data_object to populate filter for now
                filterDataObject = rootModel.where_data_object;
            return contrail.checkIfKeyExistInObject(true, filterDataObject, 'value_option_list.' + name) ? filterDataObject['value_option_list'][name] : [];
        },

        deleteFilterAndClause: function() {
            var andClauses = this.model().collection,
                andClause = this.model();

            if (andClauses.length > 1) {
                andClauses.remove(andClause);
            }
        },

        getWhereOperatorOptionList: function (viewModel){
            var rootModel = viewModel.parentModel(),
                resultOperatorArr = [{id: '=', text: '='}],
                name = (contrail.checkIfExist(viewModel.name())) ? viewModel.name() : "",
                tableType = contrail.checkIfExist (rootModel.parentModel.table_type() ) ? rootModel.parentModel.table_type() : "",
                tableColumnsMap = rootModel.parentModel.ui_added_parameters().table_schema_column_names_map,
                matchedColumnObj = tableColumnsMap[name];

            if (tableType == "FLOW") {
                if (name == "sourcevn" || name == "destvn" || name == "vrouter") {
                    resultOperatorArr.push({id: 'Starts with', text: 'Starts with'});
                }
            } else if (tableType == "OBJECT" && name == "ObjectId") {
                resultOperatorArr.push({id: 'Starts with', text: 'Starts with'});

            } else if (tableType == "STAT") {
                if (!(_.isEmpty(matchedColumnObj))) {
                    // if column type = string         => Starts With allowed
                    if (matchedColumnObj.datatype == "string") {
                        resultOperatorArr.push({id: 'Starts with', text: 'Starts with'});
                    }
                }
            }
            return resultOperatorArr;
        },

        getValueOptionList: function(viewModel) {
            var rootModel = viewModel.parentModel().parentModel.model(),
                name = viewModel.name(),
                whereDataObject = rootModel.get('where_data_object');

            name = contrail.checkIfFunction(name) ? name() : name;

            return contrail.checkIfExist(whereDataObject['value_option_list']) ? contrail.handleIfNull(whereDataObject['value_option_list'][name], []) : [];
        },

        getSuffixNameOptionList: function(viewModel) {
            var rootModel = viewModel.parentModel().parentModel.model(),
                name = viewModel.name(),
                whereDataObject = rootModel.get('where_data_object'),
                suffixNameOptionList = [];

            name = contrail.checkIfFunction(name) ? name() : name;

            $.each(whereDataObject['name_option_list'], function(schemaKey, schemaValue) {
                if(schemaValue.name === name && schemaValue.suffixes !== null) {
                    suffixNameOptionList = $.map(schemaValue.suffixes, function(suffixValue, suffixKey) {
                        return {id: suffixValue, text: suffixValue};
                    });
                    return false;
                }
            });

            return suffixNameOptionList;
        },

        validations: {}
    });


    return QueryAndModel;
});

/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */

define('query-or-model',[
    'underscore',
    'backbone',
    'knockout',
    'contrail-model',
    'query-and-model'
], function (_, Backbone, Knockout, ContrailModel, QueryAndModel) {
    var QueryOrModel = ContrailModel.extend({

        defaultConfig: {
            orClauseText: '',
            orClauseJSON: []
        },

        constructor: function (parentModel, modelData) {
            this.parentModel = parentModel;
            ContrailModel.prototype.constructor.call(this, modelData);
            return this;
        },

        validateAttr: function (attributePath, validation, data) {
            var model = data.model().attributes.model(),
                attr = cowu.getAttributeFromPath(attributePath),
                errors = model.get(cowc.KEY_MODEL_ERRORS),
                attrErrorObj = {}, isValid;

            isValid = model.isValid(attributePath, validation);

            attrErrorObj[attr + cowc.ERROR_SUFFIX_ID] = (isValid == true) ? false : isValid;
            errors.set(attrErrorObj);
        },

        formatModelConfig: function(modelConfig) {
            var self = this,
                parentModel = self.parentModel,
                whereDataObject = parentModel.model().get('where_data_object'),
                orClauseJSON = modelConfig.orClauseJSON,
                orClauseLength = orClauseJSON.length,
                andClauseModels = [], andClauseModel,
                andClausesCollectionModel,
                andClauseObj = {};

            for (var i = 0 ; i < orClauseLength; i += 1) {
                andClauseObj = {
                    name: orClauseJSON[i].name,
                    operator: cowc.OPERATOR_CODES[orClauseJSON[i].op],
                    value: orClauseJSON[i].value
                };

                if (qewu.getNameSuffixKey(orClauseJSON[i].name, whereDataObject['name_option_list']) !== -1 &&
                    (i + 1) < orClauseLength && qewu.getNameSuffixKey(orClauseJSON[i+1].name, whereDataObject['name_option_list']) === -1) {
                    i = i + 1;
                    andClauseObj.suffix_name = orClauseJSON[i].name;
                    andClauseObj.suffix_operator = cowc.OPERATOR_CODES[orClauseJSON[i].op];
                    andClauseObj.suffix_value = orClauseJSON[i].value;
                } else if (contrail.checkIfExist(orClauseJSON[i].suffix)) {
                    andClauseObj.suffix_name = orClauseJSON[i].suffix.name;
                    andClauseObj.suffix_operator = cowc.OPERATOR_CODES[orClauseJSON[i].suffix.op];
                    andClauseObj.suffix_value = orClauseJSON[i].suffix.value;
                }

                andClauseModel = new QueryAndModel(self, andClauseObj);
                andClauseModels.push(andClauseModel);
            }

            andClauseModels.push(new QueryAndModel(self, {}));

            andClausesCollectionModel = new Backbone.Collection(andClauseModels);
            modelConfig['and_clauses'] = andClausesCollectionModel;

            return modelConfig;
        },

        addOrClauseAtIndex: function(data, event) {
            var self = this,
                orClauses = this.model().collection,
                orClause = this.model(),
                orClauseIndex = _.indexOf(orClauses.models, orClause),
                newOrClause = new QueryOrModel(self.parentModel(), {});

            orClauses.add(newOrClause, {at: orClauseIndex + 1});

            $(event.target).parents('.collection').accordion('refresh');
            $(event.target).parents('.collection').accordion("option", "active", orClauseIndex + 1);

            event.stopImmediatePropagation();
        },

        deleteWhereOrClause: function() {
            var orClauses = this.model().collection,
                orClause = this.model();

            if (orClauses.length > 1) {
                orClauses.remove(orClause);
            }
        },

        getOrClauseText: function(data) {
            var andClauses = data.and_clauses()(),
                andClauseArray = [], orClauseText = '',
                tableType = data.parentModel().model().get('table_type'),
                suffixAndTerm = { FLOW: ' AND ', STAT: ' & '};

            $.each(andClauses, function(andClauseKey, andClauseValue) {
                var name = andClauseValue.name(),
                    operator = andClauseValue.operator(),
                    value = andClauseValue.value(),
                    suffixName = andClauseValue.suffix_name(),
                    suffixOperator = andClauseValue.suffix_operator(),
                    suffixValue = andClauseValue.suffix_value()(),
                    andClauseStr = '';

                name = contrail.checkIfFunction(name) ? name() : name;
                suffixName = contrail.checkIfFunction(suffixName) ? suffixName() : suffixName;
                operator = contrail.checkIfFunction(operator) ? operator() : operator;
                suffixOperator = contrail.checkIfFunction(suffixOperator) ? suffixOperator() : suffixOperator;
                value = contrail.checkIfFunction(value) ? value() : value;
                suffixValue = contrail.checkIfFunction(suffixValue) ? suffixValue() : suffixValue;

                if (name !== '' &&  operator !== '' && value !== '') {
                    andClauseStr = name + ' ' + operator + ' ' + value;

                    if (suffixName !== '' &&  suffixOperator !== '' && suffixValue !== '') {
                        andClauseStr += suffixAndTerm[tableType] + suffixName + ' ' + suffixOperator + ' ' + suffixValue;
                    }

                    andClauseArray.push(andClauseStr)
                }
            });

            orClauseText = (andClauseArray.length > 0) ? andClauseArray.join(' AND ') : '';

            data.orClauseText(orClauseText)
            return (orClauseText !== '') ? orClauseText : '...';
        },

        validations: {}
    });


    return QueryOrModel;
});

/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */

define('query-form-model',[
    'underscore',
    'backbone',
    'knockout',
    'contrail-model',
    'query-or-model',
    'query-and-model',
    'js/common/qe.utils'
], function (_, Backbone, Knockout, ContrailModel, QueryOrModel, QueryAndModel,qewu) {
    var QueryFormModel = ContrailModel.extend({
        defaultSelectFields: [],
        disableSelectFields: [],
        disableSubstringInSelectFields: ['CLASS('],
        disableWhereFields: [],

        constructor: function (modelData, queryReqConfig) {
            var self = this, modelRemoteDataConfig,
                defaultQueryReqConfig = {chunk: 1, autoSort: true, chunkSize: cowc.QE_RESULT_CHUNK_SIZE_10K, async: true};

            var defaultSelectFields = this.defaultSelectFields,
                disableFieldArray = [].concat(defaultSelectFields).concat(this.disableSelectFields),
                disableSubstringArray = this.disableSubstringInSelectFields;

            if (contrail.checkIfExist(modelData.table_name)) {
                modelRemoteDataConfig = getTableSchemaConfig(self, modelData.table_name, disableFieldArray, disableSubstringArray, this.disableWhereFields);
            }

            if(contrail.checkIfExist(queryReqConfig)) {
                defaultQueryReqConfig = $.extend(true, defaultQueryReqConfig, queryReqConfig);
            }

            this.defaultQueryReqConfig = defaultQueryReqConfig;

            ContrailModel.prototype.constructor.call(this, modelData, modelRemoteDataConfig);

            this.model().on( "change:table_name", this.onChangeTable, this);

            //TODO - Needs to be tested for Flow Pages
            this.model().on("change:time_range change:from_time change:to_time", this.onChangeTime, this);

            return this;
        },

        onChangeTime: function() {
            var model = this.model(),
                timeRange = model.attributes.time_range;

            this.setTableFieldValues();
        },

        setTableFieldValues: function() {
            var contrailViewModel = this.model(),
                tableName = contrailViewModel.attributes.table_name,
                timeRange = contrailViewModel.attributes.time_range;

            if (contrail.checkIfExist(tableName)) {
                qewu.fetchServerCurrentTime(function(serverCurrentTime) {
                    var fromTimeUTC = serverCurrentTime - (timeRange * 1000),
                        toTimeUTC = serverCurrentTime

                    if (timeRange !== -1) {
                        fromTimeUTC = new Date(contrailViewModel.attributes.from_time).getTime();
                        toTimeUTC = new Date(contrailViewModel.attributes.to_time).getTime();
                    }

                    var data =  {
                        fromTimeUTC: fromTimeUTC,
                        toTimeUTC: toTimeUTC,
                        table_name: 'StatTable.FieldNames.fields',
                        select: ['name', 'fields.value'],
                        where: [[{"name":"name","value":tableName,"op":7}]]
                    };

                    $.ajax({
                        url: '/api/qe/table/column/values',
                        type: "POST",
                        data: JSON.stringify(data),
                        contentType: "application/json; charset=utf-8",
                        dataType: "json"
                    }).done(function (resultJSON) {
                        var valueOptionList = {};
                        $.each(resultJSON.data, function(dataKey, dataValue) {
                            var nameOption = dataValue.name.split(':')[1];

                            if (!contrail.checkIfExist(valueOptionList[nameOption])) {
                                valueOptionList[nameOption] = [];
                            }

                            valueOptionList[nameOption].push(dataValue['fields.value']);
                        });

                        contrailViewModel.attributes.where_data_object['value_option_list'] = valueOptionList;

                    }).error(function(xhr) {
                        console.log(xhr);
                    });
                });
            }
        },

        onChangeTable: function() {
            var self = this,
                model = self.model();

            self.reset(this);
            var tableName = model.attributes.table_name,
                tableSchemeUrl = '/api/qe/table/schema/' + tableName,
                ajaxConfig = {
                    url: tableSchemeUrl,
                    type: 'GET'
                },
                contrailViewModel = this.model(),
                defaultSelectFields = this.defaultSelectFields,
                disableFieldArray = [].concat(defaultSelectFields).concat(this.disableSelectFields),
                disableSubstringArray = this.disableSubstringInSelectFields;

            if(tableName != '') {
                $.ajax(ajaxConfig).success(function(response) {
                    var selectFields = getSelectFields4Table(response, disableFieldArray, disableSubstringArray),
                        whereFields = getWhereFields4NameDropdown(response, tableName, self.disableWhereFields);

                    self.select_data_object().requestState((selectFields.length > 0) ? cowc.DATA_REQUEST_STATE_SUCCESS_NOT_EMPTY : cowc.DATA_REQUEST_STATE_SUCCESS_EMPTY);
                    contrailViewModel.set({
                        'ui_added_parameters': {
                            'table_schema': response,
                            'table_schema_column_names_map' : getTableSchemaColumnMap(response)
                        }
                    });

                    setEnable4SelectFields(selectFields, self.select_data_object().enable_map());
                    self.select_data_object().select_fields(selectFields);

                    contrailViewModel.attributes.where_data_object['name_option_list'] = whereFields;

                    if(self.table_type() == cowc.QE_OBJECT_TABLE_TYPE) {
                        self.onChangeTime();
                    }
                }).error(function(xhr) {
                    console.log(xhr);
                });
            }
        },

        formatModelConfig: function(modelConfig) {
            var whereOrClausesCollectionModel, filterAndClausesCollectionModel;

            whereOrClausesCollectionModel = new Backbone.Collection([]);
            modelConfig['where_or_clauses'] = whereOrClausesCollectionModel;

            filterAndClausesCollectionModel = new Backbone.Collection([]);
            modelConfig['filter_and_clauses'] = filterAndClausesCollectionModel;

            return modelConfig;
        },

        saveSelect: function (callbackObj) {
            try {
                if (contrail.checkIfFunction(callbackObj.init)) {
                    callbackObj.init();
                }
                this.select(this.select_data_object().checked_fields().join(", "));
                if (contrail.checkIfFunction(callbackObj.success)) {
                    callbackObj.success();
                }
            } catch (error) {
                if (contrail.checkIfFunction(callbackObj.error)) {
                    callbackObj.error(this.getFormErrorText(this.query_prefix()));
                }
            }
        },

        saveWhere: function (callbackObj) {
            try {
                if (contrail.checkIfFunction(callbackObj.init)) {
                    callbackObj.init();
                }

                this.where(qewu.parseWhereCollection2String(this));

                if (contrail.checkIfFunction(callbackObj.success)) {
                    callbackObj.success();
                }
            } catch (error) {
                if (contrail.checkIfFunction(callbackObj.error)) {
                    callbackObj.error(this.getFormErrorText(this.query_prefix()));
                }
            }
        },

        saveFilter: function (callbackObj) {
            try {
                if (contrail.checkIfFunction(callbackObj.init)) {
                    callbackObj.init();
                }

                this.filters(qewu.parseFilterCollection2String(this));

                if (contrail.checkIfFunction(callbackObj.success)) {
                    callbackObj.success();
                }
            } catch (error) {
                if (contrail.checkIfFunction(callbackObj.error)) {
                    callbackObj.error(this.getFormErrorText(this.query_prefix()));
                }
            }
        },

        isSelectTimeChecked: function() {
            var self = this,
                selectString = self.select(),
                selectStringCheckedFields = (selectString !== null) ? selectString.split(', ') : [];

            return selectStringCheckedFields.indexOf("T=") != -1;
        },

        toggleAdvancedFields: function() {
            var showAdvancedOptions = this.model().get('show_advanced_options');
            this.show_advanced_options(!showAdvancedOptions);
        },

        getAdvancedOptionsText: function() {
            var showAdvancedOptions = this.show_advanced_options();

            if (!showAdvancedOptions) {
                return 'Show Advanced Options';
            } else {
                return 'Hide Advanced Options';
            }
        },

        getSortByOptionList: function(viewModel) {
            var validSortFields = this.select_data_object().checked_fields(),
                invalidSortFieldsArr = ["T=" , "UUID"],
                resultSortFieldsDataArr = [];

            for(var i=0; i< validSortFields.length; i++){
                if(invalidSortFieldsArr.indexOf(validSortFields[i]) === -1) {
                    resultSortFieldsDataArr.push({id: validSortFields[i], text: validSortFields[i]});
                }
            }
            return resultSortFieldsDataArr;
        },

        getFormModelAttributes: function () {
            var modelAttrs = this.model().attributes,
                attrs4Server = {},
                ignoreKeyList = ['elementConfigMap', 'errors', 'locks', 'ui_added_parameters', 'where_or_clauses', 'select_data_object', 'where_data_object',
                                 'filter_data_object', 'filter_and_clauses', 'sort_by', 'sort_order', 'log_category', 'log_type', 'is_request_in_progress',
                                 'show_advanced_options'];

            for (var key in modelAttrs) {
                if(modelAttrs.hasOwnProperty(key) && ignoreKeyList.indexOf(key) == -1) {
                    attrs4Server[key] = modelAttrs[key];
                }
            }

            return attrs4Server;
        },

        getQueryRequestPostData: function (serverCurrentTime, customQueryReqObj, useOldTime) {
            var self = this,
                formModelAttrs = this.getFormModelAttributes(),
                queryReqObj = {};

            if(useOldTime != true) {
                qewu.setUTCTimeObj(this.query_prefix(), formModelAttrs, serverCurrentTime);
            }

            self.from_time_utc(formModelAttrs.from_time_utc);
            self.to_time_utc(formModelAttrs.to_time_utc);

            queryReqObj['formModelAttrs'] = formModelAttrs;
            queryReqObj.queryId = qewu.generateQueryUUID();
            queryReqObj.engQueryStr = qewu.getEngQueryStr(formModelAttrs);

            queryReqObj = $.extend(true, self.defaultQueryReqConfig, queryReqObj, customQueryReqObj)

            return queryReqObj;
        },

        reset: function (data, event) {
            this.time_range(600);
            this.time_granularity(60);
            this.time_granularity_unit('secs');
            this.select('');
            this.where('');
            this.direction("1");
            this.filters('');
            this.select_data_object().reset(data);
            this.model().get('where_or_clauses').reset();
            this.model().get('filter_and_clauses').reset();
        },

        addNewOrClauses: function(orClauseObject) {
            var self = this,
                whereOrClauses = this.model().get('where_or_clauses'),
                newOrClauses = [];

            $.each(orClauseObject, function(orClauseKey, orClauseValue) {
                newOrClauses.push(new QueryOrModel(self, orClauseValue));
            });

            whereOrClauses.add(newOrClauses);
        },

        addNewFilterAndClause: function(andClauseObject) {
            var self = this,
                filterObj = andClauseObject.filter,
                limitObj = andClauseObject.limit,
                sortByArr = andClauseObject.sort_fields,
                sortOrderStr = andClauseObject.sort_order,
                filterAndClauses = this.model().attributes.filter_and_clauses;

            if(contrail.checkIfExist(filterObj)) {
                $.each(filterObj, function(filterObjKey, filterObjValue) {
                    var modelDataObj = {
                        name    : filterObjValue.name,
                        operator: filterObjValue.op,
                        value   : filterObjValue.value
                    };
                    var newAndClause = new QueryAndModel(self.model().attributes, modelDataObj);
                    filterAndClauses.add(newAndClause);
                });
            }
            if(contrail.checkIfExist(limitObj)) {
                this.limit(limitObj);
            }
            if(contrail.checkIfExist(sortOrderStr)) {
                this.sort_order(sortOrderStr);
            }
            if(contrail.checkIfExist(sortByArr) && sortByArr.length > 0) {
                this.sort_by(sortByArr);
            }
        },

        addFilterAndClause: function() {
            var andClauses = this.model().get('filter_and_clauses'),
                newAndClause = new QueryAndModel(this.model().attributes);
            andClauses.add([newAndClause]);
        },

        isSuffixVisible: function(name) {
            var whereDataObject = this.model().get('where_data_object');
            name = contrail.checkIfFunction(name) ? name() : name;
            return (qewu.getNameSuffixKey(name, whereDataObject['name_option_list']) != -1);
        },

        getTimeGranularityUnits: function() {
            var self = this;

            return Knockout.computed(function () {

                var timeRange = self.time_range(),
                    fromTime = new Date(self.from_time()).getTime(),
                    toTime = new Date(self.to_time()).getTime(),
                    timeGranularityUnits = [];

                timeGranularityUnits.push({id: "secs", text: "secs"});

                if (timeRange == -1) {
                    timeRange = (toTime - fromTime) / 1000;
                }

                if (timeRange > 60) {
                    timeGranularityUnits.push({id: "mins", text: "mins"});
                }
                if (timeRange > 3600) {
                    timeGranularityUnits.push({id: "hrs", text: "hrs"});
                }
                if (timeRange > 86400) {
                    timeGranularityUnits.push({id: "days", text: "days"});
                }

                return timeGranularityUnits;


            }, this);
        },

        validations: {
            runQueryValidation: {
                'table_name': {
                    required: true,
                    msg: ctwm.getRequiredMessage('table name')
                },
                'select': {
                    required: true,
                    msg: ctwm.getRequiredMessage('select')
                },
                from_time: function(value) {
                    var fromTime = new Date(value).getTime(),
                        toTime = new Date(this.attributes.to_time).getTime(),
                        timeRange = this.attributes.time_range;

                    if(fromTime > toTime && timeRange == -1) {
                        return cowm.FROM_TIME_SMALLER_THAN_TO_TIME;
                    }
                },
                to_time: function(value) {
                    var toTime = new Date(value).getTime(),
                        fromTime = new Date(this.attributes.from_time).getTime(),
                        timeRange = this.attributes.time_range;

                    if (toTime < fromTime && timeRange == -1) {
                        return cowm.TO_TIME_GREATER_THAN_FROM_TIME;
                    }
                }
            }
        }
    });

    function getTableSchemaConfig(model, tableName, disableFieldArray, disableSubstringArray, disableWhereFields) {
        var tableSchemeUrl = '/api/qe/table/schema/' + tableName,
            modelRemoteDataConfig = {
                remote: {
                    ajaxConfig: {
                        url: tableSchemeUrl,
                        type: 'GET'
                    },
                    setData2Model: function (contrailViewModel, response) {
                        var selectFields = getSelectFields4Table(response, disableFieldArray, disableSubstringArray),
                            whereFields = getWhereFields4NameDropdown(response, tableName, disableWhereFields);

                        model.select_data_object().requestState((selectFields.length > 0) ? cowc.DATA_REQUEST_STATE_SUCCESS_NOT_EMPTY : cowc.DATA_REQUEST_STATE_SUCCESS_EMPTY);
                        contrailViewModel.set({
                            'ui_added_parameters': {
                                'table_schema': response,
                                'table_schema_column_names_map' : getTableSchemaColumnMap(response)
                            }
                        });
                        setEnable4SelectFields(selectFields, model.select_data_object().enable_map());
                        model.select_data_object().select_fields(selectFields);

                        contrailViewModel.attributes.where_data_object['name_option_list'] = whereFields;
                    }
                },
                vlRemoteConfig: {
                    vlRemoteList: []
                }
            };
        return modelRemoteDataConfig;
    };

    function getTableSchemaColumnMap (tableSchema) {
        var tableSchemaColumnMapObj = {},
            cols = tableSchema.columns;
        for(var i = 0; i < cols.length; i++) {
            var colName = cols[i]["name"];
            tableSchemaColumnMapObj[colName]  = cols[i];
        }
        return tableSchemaColumnMapObj;
    };

    function getSelectFields4Table(tableSchema, disableFieldArray, disableSubstringArray) {
        if ($.isEmptyObject(tableSchema)) {
           return [];
        }
        var tableColumns = tableSchema['columns'],
            filteredSelectFields = [];

        $.each(tableColumns, function (k, v) {
            if (contrail.checkIfExist(v) && showSelectField(v.name, disableFieldArray, disableSubstringArray)) {
                filteredSelectFields.push(v);
            }
        });

        _.sortBy(filteredSelectFields, 'name');
        return filteredSelectFields;
    };

    function showSelectField(fieldName, disableFieldArray, disableSubstringArray) {
        var showField = true;

        for (var i = 0; i < disableSubstringArray.length; i++) {
            if(fieldName.indexOf(disableSubstringArray[i]) != -1) {
                showField = false;
                break;
            }
        }

        if(disableFieldArray.indexOf(fieldName) != -1) {
            showField = false;
        }

        return showField;
    };

    function getWhereFields4NameDropdown(tableSchema, tableName, disableWhereFields) {
        if ($.isEmptyObject(tableSchema)) {
            return [];
        }
        var tableSchemaFormatted = [];

        $.each(tableSchema.columns, function(schemaKey, schemaValue) {
            if (schemaValue.index && disableWhereFields.indexOf(schemaValue.name) == -1){
                if (tableName === 'FlowSeriesTable' || tableName === 'FlowRecordTable') {
                    if (schemaValue.name === 'protocol') {
                        schemaValue.suffixes = ['sport', 'dport'];
                        tableSchemaFormatted.push(schemaValue);
                    } else if (schemaValue.name === 'sourcevn') {
                        schemaValue.suffixes = ['sourceip'];
                        tableSchemaFormatted.push(schemaValue);
                    } else if (schemaValue.name === 'destvn') {
                        schemaValue.suffixes = ['destip'];
                        tableSchemaFormatted.push(schemaValue);
                    } else if (schemaValue.name === 'vrouter') {
                        tableSchemaFormatted.push(schemaValue);
                    } else {
                        schemaValue.index = false;
                    }
                } else {
                    tableSchemaFormatted.push(schemaValue);
                }
            }
        });

        return tableSchemaFormatted
    }

    function setEnable4SelectFields(selectFields, isEnableMap) {
        for (var key in isEnableMap) {
            delete isEnableMap[key];
        }

        for (var i = 0; i < selectFields.length; i++) {
            isEnableMap[selectFields[i]['name']] = ko.observable(true);
        }
    }

    return QueryFormModel;
});

/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */

define('core-basedir/js/models/NodeConsoleLogsModel',[
    'underscore',
    'knockout',
    'query-form-model'
], function (_, Knockout, QueryFormModel) {
    var NodeConsoleLogsModel = QueryFormModel.extend({

        defaultSelectFields: [],
        disableSelectFields: ['Type', 'SequenceNum', 'Context', 'Keyword'],

        constructor: function (modelData, queryReqConfig) {
            var defaultConfig = qewmc.getQueryModelConfig({
                time_range: 600,
                select: "MessageTS,Messagetype,Level,Category,Xmlmessage",
                hostname:"",
                node_type: "",
                table_name: cowc.MESSAGE_TABLE,
                table_type: cowc.QE_LOG_TABLE_TYPE,
                query_prefix: cowc.CONSOLE_LOGS_PREFIX,
                log_category: "",
                log_type: "",
                log_level: "5",
                limit: "50",
                keywords: "",
                where:""
            });

            modelData = $.extend(true, {}, defaultConfig, modelData);
            QueryFormModel.prototype.constructor.call(this, modelData, $.extend(true, queryReqConfig, {chunkSize: cowc.QE_RESULT_CHUNK_SIZE_1K, async: false}));
            return this;
        },

        validations: {},

        reset: function (data, event) {
            this.time_range(600);
            this.log_category('');
            this.log_type('any');
            this.log_level('5');
            this.limit("50");
            this.keywords('');
        },
    });

    return NodeConsoleLogsModel;
});

/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */

define('core-basedir/js/views/NodeConsoleLogsView',[
    'underscore',
    'query-form-view',
    'knockback',
    'core-basedir/js/models/NodeConsoleLogsModel',
    'js/common/qe.utils'
], function (_, QueryFormView, Knockback, NodeConsoleLogsModel,qewu) {
    var nodeType,hostname;
    var NodeConsoleLogsView = QueryFormView.extend({
        render: function () {
            var self = this,
                viewConfig = self.attributes.viewConfig,
                modelMap = contrail.handleIfNull(self.modelMap, {}),
                elementId = self.attributes.elementId,
                queryPageTmpl = contrail.getTemplate4Id(ctwc.TMPL_QUERY_PAGE),
                consoleLogsModel = new NodeConsoleLogsModel(),
                queryFormId = cowc.QE_HASH_ELEMENT_PREFIX + cowc.CONSOLE_LOGS_PREFIX + cowc.QE_FORM_SUFFIX;

            hostname = viewConfig.hostname;
            nodeType = viewConfig.nodeType;
            consoleLogsModel.node_type(nodeType);
            consoleLogsModel.hostname(hostname);
            self.model = consoleLogsModel;

            self.$el.append(queryPageTmpl({queryPrefix: cowc.CONSOLE_LOGS_PREFIX }));

            self.renderView4Config($(self.$el).find(queryFormId), this.model, self.getViewConfig(), null, null, modelMap, function () {
                self.model.showErrorAttr(elementId, false);
                Knockback.applyBindings(self.model, document.getElementById(elementId));
                kbValidation.bind(self);
                $("#display_logs").on('click', function() {
                    self.renderQueryResult();
                });
                self.getLastLogTimeStampAndRenderResults(self,consoleLogsModel);

            });
        },

        getLastLogTimeStampAndRenderResults : function(self,consoleLogsModel) {
            var postData = monitorInfraUtils.getPostDataForGeneratorType(
                                {
                                    nodeType:nodeType,
                                    cfilt:"ModuleServerState:msg_stats",
                                    hostname:hostname
                                }
                            );
            $.ajax({
                url:cowc.TENANT_API_URL,
                type:'post',
                data:postData,
                dataType:'json'
            }).done(function (result) {
                //Update the logtype combobox which is dependent on the same results.
                self.updateLogTypeDropdown(result);
                var logLevelStats = [], lastLog, lastMsgLogTime, lastTimeStamp,
                    allStats = [],defaultTimeRange = 600;
                try{
                    allStats =  ifNullOrEmptyObject(jsonPath(result,"$..log_level_stats"),[]);
                }catch(e){}
                if(allStats instanceof Array){
                    for(var i = 0; i < allStats.length;i++){
                        if(!($.isEmptyObject(allStats[i]))){
                            if( allStats[i] instanceof Array){
                                logLevelStats = logLevelStats.concat(allStats[i]);
                            } else {
                                logLevelStats.push(allStats[i]);
                            }
                        }
                    }
                }
                if(logLevelStats != null){
                    lastLog = monitorInfraUtils.getMaxGeneratorValueInArray(logLevelStats,"last_msg_timestamp");
                    if(lastLog != null){
                        lastTimeStamp = parseInt(lastLog.last_msg_timestamp)/1000 + 1000;
                        lastLogLevel = lastLog.level;
                    }
                }
                if(lastTimeStamp == null || lastMsgLogTime != lastTimeStamp){
                    lastMsgLogTime = lastTimeStamp;
                    if(lastMsgLogTime != null && lastLogLevel != null){
                        consoleLogsModel.to_time(new Date(lastMsgLogTime));
                        consoleLogsModel.from_time(moment(new Date(lastMsgLogTime)).subtract('s', defaultTimeRange));
                        consoleLogsModel.log_level(self.getLogLevelValueFromLogLevel(lastLogLevel));
                        consoleLogsModel.time_range('-1');
                    }
                    self.renderQueryResult();
                }
            });

        },

        updateLogTypeDropdown : function(result) {

            var msgTypeStatsList = [{text:'Any',value:'any'}];
            var msgStats = [];
            try{
                msgStats =  ifNullOrEmptyObject(jsonPath(result,"$..msgtype_stats"),[]);
            }catch(e){}
            if(msgStats instanceof Array){
                for(var i = 0; i < msgStats.length;i++){
                    if(!($.isEmptyObject(msgStats[i]))){
                        if( msgStats[i] instanceof Array){
                            $.each(msgStats[i],function(i,msgStat){
                                var msgType = msgStat['message_type'];
                                msgTypeStatsList.push({text:msgType,value:msgType});
                            });
                        } else {
                            msgTypeStatsList.push({text:msgStats[i]['message_type'],value:msgStats[i]['message_type']});
                        }
                    }
                }
            }
            var logTypeDd = $('#log_type_dropdown').data('contrailDropdown');
            if(logTypeDd != null) {
                logTypeDd.setData(msgTypeStatsList);
                logTypeDd.value('any');
            }
        },

        getLogLevelValueFromLogLevel : function (logLevel) {
            var qeLevels = cowc.QE_LOG_LEVELS;
            $.each(qeLevels, function(key,levelObj) {
                if(levelObj.name == logLevel) {
                    return levelObj.value;
                }
            })
        },

        renderQueryResult: function() {
            var self = this,
                modelMap = contrail.handleIfNull(self.modelMap, {}),
                queryFormModel = self.model,
                queryResultId = cowc.QE_HASH_ELEMENT_PREFIX + cowc.CONSOLE_LOGS_PREFIX + cowc.QE_RESULTS_SUFFIX,
                queryResultTabId = cowl.QE_SYSTEM_LOGS_TAB_ID;

            formatQueryParams(queryFormModel);

            queryFormModel.is_request_in_progress(true);
            qewu.fetchServerCurrentTime(function(serverCurrentTime) {
                var timeRange = parseInt(queryFormModel.time_range()),
                    queryRequestPostData;

                if (timeRange !== -1) {
                    queryFormModel.to_time(serverCurrentTime);
                    queryFormModel.from_time(serverCurrentTime - (timeRange * 1000));
                }

                queryRequestPostData = queryFormModel.getQueryRequestPostData(serverCurrentTime);
                queryRequestPostData.chunkSize = cowc.QE_RESULT_CHUNK_SIZE_10K;
                self.renderView4Config($(queryResultId), queryFormModel,
                    getQueryResultTabViewConfig(queryRequestPostData, queryResultTabId), null, null, modelMap,
                    function() {
                        var queryResultListModel = modelMap[cowc.UMID_QUERY_RESULT_LIST_MODEL];

                        queryResultListModel.onAllRequestsComplete.subscribe(function () {
                            queryFormModel.is_request_in_progress(false);
                        });
                    });
            });
        },

        getViewConfig: function () {
            var self = this;
            return {
                view: "SectionView",
                viewConfig: {
                    rows: [
                        {
                            columns: [
                                {
                                    elementId: 'time_range', view: "FormDropdownView",
                                    viewConfig: {
                                        path: 'time_range', dataBindValue: 'time_range', class: "span2",
                                        elementConfig: {dataTextField: "text", dataValueField: "id", data: cowc.TIMERANGE_DROPDOWN_VALUES}}
                                },
                                {
                                    elementId: 'from_time', view: "FormDateTimePickerView",
                                    viewConfig: {
                                        style: 'display: none;',
                                        path: 'from_time', dataBindValue: 'from_time', class: "span4",
                                        elementConfig: qewu.getFromTimeElementConfig('from_time', 'to_time'),
                                        visible: "time_range() == -1"
                                    }
                                },
                                {
                                    elementId: 'to_time', view: "FormDateTimePickerView",
                                    viewConfig: {
                                        style: 'display: none;',
                                        path: 'to_time', dataBindValue: 'to_time', class: "span4",
                                        elementConfig: qewu.getToTimeElementConfig('from_time', 'to_time'),
                                        visible: "time_range() == -1"
                                    }
                                }
                            ]
                        },
                        {
                            columns: [
                                {
                                    elementId: 'log_category', view: "FormDropdownView",
                                    viewConfig: {
                                        path: 'log_category', dataBindValue: 'log_category', class: "span2",
                                        elementConfig: {
                                            dataTextField: "text",
                                            dataValueField: "value",
                                            defaultValueId: 0,
                                            dataSource: {
                                                type:'remote',
                                                url: monitorInfraConstants.
                                                        monitorInfraUrls
                                                            ['MSGTABLE_CATEGORY'],
                                                async:true,
                                                parse:function(response){
                                                    var ret = [{text:'All',value:'All'}];
                                                    var catList = [];
                                                    if (nodeType == monitorInfraConstants.CONTROL_NODE){
                                                        catList = ifNull(response[monitorInfraConstants.UVEModuleIds['CONTROLNODE']], []);
                                                    } else if (nodeType == monitorInfraConstants.COMPUTE_NODE) {
                                                        catList = ifNull(response[monitorInfraConstants.UVEModuleIds['VROUTER_AGENT']], []);
                                                    } else if (nodeType == monitorInfraConstants.ANALYTICS_NODE) {
                                                        catList = ifNull(response[monitorInfraConstants.UVEModuleIds['COLLECTOR']], []);
                                                    } else if (nodeType == monitorInfraConstants.CONFIG_NODE) {
                                                        catList = ifNull(response[monitorInfraConstants.UVEModuleIds['APISERVER']], []);
                                                    }
                                                    $.each(catList, function (key, value) {
                                                        if(key != '')
                                                            ret.push({text:value, value:value});
                                                    });
                                                    return ret;
                                                }
                                            }
                                        }
                                    }
                                },
                                {
                                    elementId: 'log_type', view: "FormDropdownView",
                                    viewConfig: {
                                        path: 'log_type', dataBindValue: 'log_type', class: "span2",
                                        elementConfig: {
                                            dataTextField: "text",
                                            dataValueField: "value",
                                            defaultValueId: 0,
                                            dataSource: {
                                                data:[{text:'Any',value:'any'}]
                                            }
                                        }
                                    }
                                },
                                {
                                    elementId: 'log_level', view: "FormDropdownView",
                                    viewConfig: { path: 'log_level', dataBindValue: 'log_level', class: "span2", elementConfig: {dataTextField: "name", dataValueField: "value", data: cowc.QE_LOG_LEVELS}}
                                },
                                {
                                    elementId: 'limit', view: "FormDropdownView",
                                    viewConfig: { path: 'limit', dataBindValue: 'limit', class: "span2", elementConfig: {dataTextField: "text", dataValueField: "id", data:cowc.CONSOLE_LOGS_LIMITS}}
                                },

                                {
                                    elementId: 'keywords', view: "FormInputView",
                                    viewConfig: { path: 'keywords', dataBindValue: 'keywords', class: "span2", placeholder: "Enter keyword(s)"}
                                }
                            ]
                        },
                        {
                            columns: [
                                {
                                    elementId: 'display_logs', view: "FormButtonView", label: "Display Logs",
                                    viewConfig: {
                                        class: 'display-inline-block margin-0-10-0-0',
                                        disabled: 'is_request_in_progress()',
                                        elementConfig: {
                                            btnClass: 'btn-primary'
                                        }
                                    }
                                },
                                {
                                    elementId: 'reset_query', view: "FormButtonView", label: "Reset",
                                    viewConfig: {
                                        label: "Reset",
                                        class: 'display-inline-block margin-0-10-0-0',
                                        elementConfig: {
                                            onClick: "reset"
                                        }
                                    }
                                }
                            ]
                        }
                    ]
                }
            };
        }
    });

    function formatQueryParams(model) {
        var limit = model.limit();
        var keywords = model.keywords();
        var filters = "limit:" + limit;
        var msgType = model.log_type();
        var hostname = model.hostname();
        var nodeType = model.node_type();
        if(msgType == 'any'){
            msgType = '';
        }
        if(keywords != '') {
            filters += ",keywords:" + keywords;
        }
        if(nodeType == monitorInfraConstants.CONTROL_NODE) {
            if(msgType != ''){
                model.where ('(ModuleId=' + monitorInfraConstants.UVEModuleIds['CONTROLNODE']
                    + ' AND Source='+ hostname +' AND Messagetype='+ msgType +')');
            } else {
                model.where( '(ModuleId=' + monitorInfraConstants.UVEModuleIds['CONTROLNODE']
                    + ' AND Source='+ hostname +')' );
            }
        } else if (nodeType == monitorInfraConstants.COMPUTE_NODE) {
            var moduleId = monitorInfraConstants.UVEModuleIds['VROUTER_AGENT'];
            var msgType = model.log_type();
            var hostname = model.hostname();
            //TODO check if the below is needed
//            if(obj['vrouterModuleId'] != null && obj['vrouterModuleId'] != ''){
//                moduleId = obj['vrouterModuleId'];
//            }
            if(msgType != ''){
                model.where('(ModuleId=' + moduleId + ' AND Source='+ hostname
                        +' AND Messagetype='+ msgType +')' );
            } else {
                model.where( '(ModuleId=' + moduleId + ' AND Source='+ hostname +')' );
            }
        } else if (nodeType == monitorInfraConstants.CONFIG_NODE) {
            if(msgType != ''){
                model.where( '(ModuleId=' + monitorInfraConstants.UVEModuleIds['SCHEMA']
                    + ' AND Source='+hostname+' AND Messagetype='+ msgType
                    +') OR (ModuleId=' + monitorInfraConstants.UVEModuleIds['APISERVER']
                    + ' AND Source='+hostname+' AND Messagetype='+ msgType
                    +') OR (ModuleId=' + monitorInfraConstants.UVEModuleIds['SERVICE_MONITOR']
                    + ' AND Source='+hostname+' AND Messagetype='+ msgType
                    +') OR (ModuleId=' + monitorInfraConstants.UVEModuleIds['DISCOVERY_SERVICE']
                    + ' AND Source='+hostname+' AND Messagetype='+ msgType +')');
            } else {
                model.where( '(ModuleId=' + monitorInfraConstants.UVEModuleIds['SCHEMA']
                    + ' AND Source='+hostname+') OR (ModuleId='
                    + monitorInfraConstants.UVEModuleIds['APISERVER']
                    + ' AND Source='+hostname+') OR (ModuleId='
                    + monitorInfraConstants.UVEModuleIds['SERVICE_MONITOR']
                    + ' AND Source='+hostname+') OR (ModuleId='
                    + monitorInfraConstants.UVEModuleIds['DISCOVERY_SERVICE']
                    + ' AND Source='+hostname+')' );
            }
        } else if (nodeType == monitorInfraConstants.ANALYTICS_NODE) {
            if(msgType != ''){
                model.where( '(ModuleId=' + monitorInfraConstants.UVEModuleIds['OPSERVER']
                    + ' AND Source='+hostname+' AND Messagetype='+ msgType
                    +') OR (ModuleId=' + monitorInfraConstants.UVEModuleIds['COLLECTOR']
                    + ' AND Source='+hostname+' AND Messagetype='+ msgType +')' );
            } else {
                model.where( '(ModuleId=' + monitorInfraConstants.UVEModuleIds['OPSERVER']
                    + ' AND Source='+hostname+') OR (ModuleId='
                    + monitorInfraConstants.UVEModuleIds['COLLECTOR']
                    + ' AND Source='+hostname+')');
            }
        }
        model.filters(filters);

        //TODO: Add where clause for category, type, and keywords. Add where clause corresponding to node type.
    };

    function getQueryResultTabViewConfig(queryRequestPostData, queryResultTabId) {
        return {
            elementId: queryResultTabId,
            view: "TabsView",
            viewConfig: {
                theme: cowc.TAB_THEME_WIDGET_CLASSIC,
                tabs: [getQueryResultGridViewConfig(queryRequestPostData)]
            }
        };
    }

    function getQueryResultGridViewConfig(queryRequestPostData) {
        return {
            elementId: cowl.QE_QUERY_RESULT_GRID_ID,
            title: cowl.TITLE_RESULTS,
            iconClass: 'icon-table',
            view: 'QueryResultGridView',
            tabConfig: {
                //TODO
            },
            viewConfig: {
                queryRequestPostData: queryRequestPostData,
                gridOptions: {
                    titleText: cowl.TITLE_SYSTEM_LOGS,
                    queryQueueUrl: cowc.URL_QUERY_LOG_QUEUE,
                    queryQueueTitle: cowl.TITLE_LOG
                }
            }
        }
    }

    return NodeConsoleLogsView;
});

/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */

define('core-basedir/js/views/QueryFilterView',[
    'underscore',
    'contrail-view',
    'knockback'
], function (_, ContrailView, Knockback) {
    var QueryFilterView = ContrailView.extend({
        render: function (renderConfig) {
            var self = this,
                viewConfig = self.attributes.viewConfig,
                editTemplate = contrail.getTemplate4Id(cowc.TMPL_EDIT_FORM),
                queryPrefix = self.model.query_prefix(),
                modalId = queryPrefix + cowl.QE_FILTER_MODAL_SUFFIX,
                filterTmplHtml = editTemplate({prefixId: queryPrefix}),
                className = viewConfig['className'];

            cowu.createModal({
                'modalId': modalId, 'className': className, 'title': cowl.TITLE_QE_FILTER, 'body': filterTmplHtml, 'onSave': function () {
                    self.model.saveFilter({
                        init: function () {
                            self.model.showErrorAttr(queryPrefix + cowc.FORM_SUFFIX_ID, false);
                            cowu.enableModalLoading(modalId);
                        },
                        success: function () {
                            if (contrail.checkIfExist(renderConfig) && contrail.checkIfFunction(renderConfig['callback'])) {
                                renderConfig['callback']();
                            }

                            //TODO - Quick Fix to adjust the height of filter textarea; Can be done in cleaner way
                            $(self.$el).find('[name="filters"]')
                                .height(0)
                                .height($(self.$el).find('[name="filters"]').get(0).scrollHeight - 5);

                            $("#" + modalId).modal('hide');
                            $("#" + modalId).remove();
                        },
                        error: function (error) {
                            cowu.disableModalLoading(modalId, function () {
                                self.model.showErrorAttr(queryPrefix + cowc.FORM_SUFFIX_ID, error.responseText);
                            });
                        }
                    }); // TODO: Release binding on successful configure
                }, 'onCancel': function () {
                    $("#" + modalId).modal('hide');
                    $("#" + modalId).remove();
                }
            });

            self.renderView4Config($("#" + queryPrefix + "-form"), this.model, getFilterViewConfig(), null, null, null, function () {
                self.model.showErrorAttr(queryPrefix + cowc.FORM_SUFFIX_ID, false);
                Knockback.applyBindings(self.model, document.getElementById(modalId));
                kbValidation.bind(self);
            });
        }
    });

    function getFilterViewConfig() {
        return {
            elementId : 'filter-accordian',
            view      : "AccordianView",
            viewConfig: [
                {
                    elementId: 'filter_by',
                    title: 'Filter',
                    view: "SectionView",
                    viewConfig:
                    {
                        rows: [
                            {
                                columns: [getFilterCollectionViewConfig()]
                            }
                        ]
                    }
                },
                {
                    elementId: 'limit_by',
                    title: 'Limit',
                    view: "SectionView",
                    viewConfig:
                    {
                        rows: [
                            {
                                columns: [{
                                    elementId: 'limit', view: "FormInputView",
                                    viewConfig: {path: 'limit', dataBindValue: 'limit', class: "span6"}
                                }]
                            }
                        ]
                    }
                },
                {
                    elementId: 'sort',
                    title: 'Sort',
                    view: "SectionView",
                    viewConfig:
                    {
                        rows: [
                            {
                                columns: [
                                    {
                                        elementId : 'sort_by', view: "FormMultiselectView",
                                        viewConfig: {
                                            path: 'sort_by', dataBindValue: 'sort_by', class: "span9",
                                            dataBindOptionList: 'getSortByOptionList()',
                                            elementConfig: {
                                                placeholder: cowc.QE_TITLE_SORT_BY
                                            }
                                        }
                                    },
                                    {
                                        elementId : 'sort_order', view: "FormDropdownView",
                                        viewConfig: {
                                            path: 'sort_order', dataBindValue: 'sort_order', class: "span3",
                                            elementConfig: {
                                                placeholder: cowc.QE_TITLE_SORT_ORDER,
                                                data: cowc.QE_SORT_ORDER_DROPDOWN_VALUES
                                            }
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                }
            ]
        }

    };

    function getFilterCollectionViewConfig() {
        return {
            elementId: 'and-clause-collection',
            title: "Filter By",
            view: "FormCollectionView",
            viewConfig: {
                class: 'and-clause-collection',
                path: 'filter_and_clauses',
                collection: 'filter_and_clauses()',
                rows: [
                    {
                        rowActions: [
                            {onClick: "deleteFilterAndClause()", iconClass: 'icon-remove'},
                            {onClick: "addAndClauseAtIndex()", iconClass: 'icon-plus'}
                        ],
                        columns: [
                            {
                                elementId: 'and-text',
                                view: "FormTextView",
                                viewConfig: {
                                    width: 40,
                                    value: "AND",
                                    class: "and-clause-text"
                                }
                            },
                            {
                                elementId: 'name',
                                name: 'Name',
                                view: "FormDropdownView",
                                class: "",
                                viewConfig: {
                                    templateId: cowc.TMPL_EDITABLE_GRID_DROPDOWN_VIEW,
                                    path: "name",
                                    dataBindValue: "name",
                                    dataBindOptionList: 'getFilterNameOptionList',
                                    width: 175,
                                    elementConfig: {
                                        placeholder: 'Select Name',
                                        defaultValueId: 0
                                    }
                                }
                            },
                            {
                                elementId: 'operator',
                                name: 'operator',
                                view: "FormDropdownView",
                                class: "",
                                viewConfig: {
                                    templateId: cowc.TMPL_EDITABLE_GRID_DROPDOWN_VIEW,
                                    path: "operator",
                                    dataBindValue: "operator",
                                    dataBindOptionList: 'getFilterOperatorOptionList',
                                    width: 100,
                                    elementConfig: {
                                        defaultValueId: 0
                                    }
                                }
                            },
                            {
                                elementId: 'value',
                                name: 'value',
                                view: "FormComboboxView",
                                class: "",
                                viewConfig: {
                                    templateId: cowc.TMPL_EDITABLE_GRID_COMBOBOX_VIEW,
                                    path: "value",
                                    dataBindValue: "value()",
                                    dataBindOptionList: 'getFilterValueOptionList',
                                    width: 175,
                                    elementConfig: {
                                        placeholder: 'Select Value'
                                    }
                                }
                            }
                        ]
                    }
                ]
            }

        };
    }

    return QueryFilterView;
});
/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */

define('js/common/qe.grid.config',[
    'underscore'
], function (_) {
    var QEGridConfig = function () {
        this.getColumnDisplay4Grid = function(tableName, tableType, selectArray) {
            var newColumnDisplay = [], columnDisplaySelect,
                columnDisplay = getColumnDisplay4Query(tableName, tableType);

            $.each(columnDisplay, function(columnKey, columnValue){
                if (selectArray.indexOf(columnValue.select) != -1) {
                    if (_.isUndefined(columnValue.display.formatter)) {
                        columnValue.display.formatter = {
                            format: cowc.QUERY_COLUMN_FORMATTER[columnValue.select]
                        };
                    }
                    newColumnDisplay.push(columnValue.display);
                }
            });

            columnDisplaySelect = $.map(columnDisplay, function(selectValue, selectKey) {
                return selectValue.select;
            });

            $.each(selectArray, function(selectKey, selectValue) {
                if(columnDisplaySelect.indexOf(selectValue) == -1) {
                    var columnName = '["' + selectValue + '"]';
                    newColumnDisplay.push({
                        id: selectValue, field: selectValue,
                        name: columnName,
                        width: columnName.length * 8,  groupable:false,
                        formatter: {
                            format: cowc.QUERY_COLUMN_FORMATTER[selectValue]
                        }
                    })
                }

            });

            return newColumnDisplay;
        };

        this.getColumnDisplay4ChartGroupGrid = function(tableName, tableType, selectArray) {
            var newColumnDisplay = [], columnDisplaySelect,
                columnDisplay = getColumnDisplay4Query(tableName, tableType);

            $.each(columnDisplay, function(columnKey, columnValue){
                if (selectArray.indexOf(columnValue.select) != -1 && !qewu.isAggregateField(columnValue.select) && columnValue.select !== 'T' && columnValue.select !== 'T=' && columnValue.select !== 'UUID') {
                    if (_.isUndefined(columnValue.display.formatter)) {
                        columnValue.display.formatter = {
                            format: cowc.QUERY_COLUMN_FORMATTER[columnValue.select]
                        };
                    }
                    newColumnDisplay.push(columnValue.display);
                }
            });

            columnDisplaySelect = $.map(columnDisplay, function(selectValue, selectKey) {
                return selectValue.select;
            });

            $.each(selectArray, function(selectKey, selectValue) {
                if(columnDisplaySelect.indexOf(selectValue) == -1 && !qewu.isAggregateField(selectValue) &&
                    selectValue !== 'T' && selectValue !== 'T=' && selectValue !== 'UUID') {
                    var columnName = '["' + selectValue + '"]';
                    newColumnDisplay.push({
                        id: selectValue, field: selectValue,
                        name: columnName,
                        width: columnName.length * 8,  groupable:false,
                        formatter: {
                            format: cowc.QUERY_COLUMN_FORMATTER[selectValue]
                        }
                    })
                }

            });

            return newColumnDisplay;
        };

        this.getQueueColumnDisplay = function(viewQueryResultCB) {
            return [
                {
                    id: 'fqq-badge', field: "", name: "", resizable: false, sortable: false,
                    width: 30, width: 30, searchable: false, exportConfig: {allow: false},
                    allowColumnPickable: false,
                    formatter: function (r, c, v, cd, dc) {
                        if(dc.status === 'completed') {
                            var queryId = dc.queryReqObj.queryId,
                                tabLinkId = cowl.QE_QUERY_QUEUE_RESULT_GRID_TAB_ID + '-' + queryId + '-tab-link',
                                labelIconBadgeClass = '';

                            if ($('#' + tabLinkId).length > 0) {
                                labelIconBadgeClass = 'icon-queue-badge-color-' + $('#' + tabLinkId).data('badge_color_key');
                            }

                            return '<span id="label-icon-badge-' + queryId + '" class="label-icon-badge label-icon-badge-queue ' + labelIconBadgeClass + '"><i class="icon-sign-blank"></i></span>';
                        }
                    },
                    events: {
                        onClick: function (e, dc) {
                            viewQueryResultCB(dc);
                        }
                    }
                },
                {
                    id:"startTime", field:"startTime", name:"Time Issued", width: 140,
                    formatter: {
                        format: 'date',
                        options: {formatSpecifier: 'llll'}
                    }
                },
                {
                    id:"table_name", field:"", name:"Table Name", width: 200, sortable:false,
                    formatter: function(r, c, v, cd, dc) {
                        return dc.queryReqObj.formModelAttrs.table_name;
                    }
                },
                {
                    id:"time_range", field:"time_range", name:"Time Range", width: 100, sortable:false,
                    formatter: {
                        format: 'query-time-range',
                        path: 'queryReqObj.formModelAttrs.time_range'
                    }
                },
                {
                    id:"fromTime", field:"fromTime", name:"From Time", width: 140,
                    formatter: {
                        format: 'date',
                        path: 'queryReqObj.formModelAttrs.from_time_utc',
                        options: {
                            formatSpecifier: 'lll'
                        }
                    }
                },
                {
                    id:"toTime", field:"toTime", name:"To Time", width: 140,
                    formatter: {
                        format: 'date',
                        path: 'queryReqObj.formModelAttrs.to_time_utc',
                        options: {
                            formatSpecifier: 'lll'
                        }
                    }
                },
                { id:"progress", field:"progress", name:"Progress", width:75, formatter: function(r, c, v, cd, dc) { return (dc.status != 'error' && dc.progress != '' && parseInt(dc.progress) > 0) ? (dc.progress + '%') : '-'; } },
                {   id:"count", field:"count", name:"Records", width:75,
                    formatter: {
                        format: 'number'
                    }
                },
                { id:"status", field:"status", name:"Status", width:90 },
                {
                    id:"timeTaken", field:"timeTaken", name:"Time Taken", width:100, sortable:true,
                    formatter: {
                        format:'time-period'
                    }
                }
            ];
        };

        this.getOnClickFlowRecord = function(parentView, queryFormAttributes) {
            return function (e, selRowDataItem) {
                var elementId = parentView.$el,
                    flowRecordDetailsConfig = {
                        elementId: cowl.QE_FLOW_DETAILS_TAB_VIEW__ID,
                        view: "FlowDetailsTabView",
                        viewPathPrefix: "reports/qe/ui/js/views/",
                        app: cowc.APP_CONTRAIL_CONTROLLER,
                        viewConfig: {
                            className: 'modal-980',
                            queryFormAttributes: queryFormAttributes,
                            selectedFlowRecord: selRowDataItem
                        }
                    };

                parentView.renderView4Config(elementId, null, flowRecordDetailsConfig);
            }
        };

        this.getOnClickSessionAnalyzer = function(clickOutView, queryId, queryFormAttributes, elementId) {
            return function (e, targetElement, selRowDataItem) {
                var elementId = $(elementId),
                    saElementId = cowl.QE_SESSION_ANALYZER_VIEW_ID + '-' + queryId + '-' + selRowDataItem.cgrid,
                    sessionAnalyzerConfig = {
                        elementId: saElementId,
                        title: cowl.TITLE_SESSION_ANALYZER,
                        iconClass: 'icon-bar-chart',
                        app: cowc.APP_CONTRAIL_CONTROLLER,
                        viewPathPrefix: "controller-basedir/reports/qe/ui/js/views/",
                        view: "SessionAnalyzerView",
                        tabConfig: {
                            removable: true,
                        },
                        viewConfig: {
                            queryType: cowc.QUERY_TYPE_ANALYZE,
                            flowRecordQueryId: queryId,
                            queryFormAttributes: queryFormAttributes,
                            selectedFlowRecord: selRowDataItem
                        }
                    };
                clickOutView.renderSessionAnalyzer(elementId, sessionAnalyzerConfig);
            }
        };

        this.setAnalyzerIconFormatter = function(r, c, v, cd, dc) {
            return '<i class="icon-external-link-sign" title="Analyze Session"></i>';
        };

        //this.setSessionAnalyzerOnClick = function(parentView, queryFormAttributes, elementId) {
        //    return function(e, selRowDataItem) {
        //        if (qewu.enableSessionAnalyzer(selRowDataItem)) {
        //            this.getOnClickSessionAnalyzer(parentView, queryFormAttributes, elementId)(e, selRowDataItem);
        //        }
        //    };
        //};

        this.getQueryGridConfig = function(remoteConfig, gridColumns, gridOptions) {
            return {
                header: {
                    title: {
                        text: gridOptions.titleText
                    },
                    defaultControls: {
                        collapseable: true,
                        refreshable: false,
                        columnPickable: true
                    }
                },
                body: {
                    options: {
                        checkboxSelectable: false,
                        fixedRowHeight: contrail.checkIfExist(gridOptions.fixedRowHeight) ? gridOptions.fixedRowHeight : 30,
                        forceFitColumns: false,
                        defaultDataStatusMessage: false,
                        actionCell: contrail.checkIfExist(gridOptions.actionCell) ? gridOptions.actionCell : false,
                        actionCellPosition: contrail.checkIfExist(gridOptions.actionCellPosition) ? gridOptions.actionCellPosition : 'end'
                    },
                    dataSource: {
                        remote: {
                            ajaxConfig: remoteConfig,
                            dataParser: function (response) {
                                return response['data'];
                            }
                        }
                    },
                    statusMessages: {
                        queued: {
                            type: 'status',
                            iconClasses: '',
                            text: cowm.getQueryQueuedMessage(gridOptions.queryQueueUrl, gridOptions.queryQueueTitle)
                        }
                    }
                },
                columnHeader: {
                    columns: gridColumns
                },
                footer: {
                    pager: contrail.handleIfNull(gridOptions.pagerOptions, {
                        options: {
                            pageSize: 100,
                            pageSizeSelect: [100, 200, 500]
                        }
                    })
                }
            };
        }
    };

    function getColumnDisplay4Query(tableName, tableType) {
        if(tableType == cowc.QE_STAT_TABLE_TYPE) {
            return columnDisplayMap["defaultStatColumns"].concat(contrail.checkIfExist(columnDisplayMap[tableName]) ? columnDisplayMap[tableName] : []);
        } else if (tableType == cowc.QE_OBJECT_TABLE_TYPE) {
            return columnDisplayMap["defaultObjectColumns"].concat(contrail.checkIfExist(columnDisplayMap[tableName]) ? columnDisplayMap[tableName] : []);
        } else {
            return contrail.checkIfExist(columnDisplayMap[tableName]) ? columnDisplayMap[tableName] : []
        }
    };

    var columnDisplayMap  = {
        "FlowSeriesTable": [
            {select:"T", display:{id:"T", field:"T", width:210, name:"Time", filterable:false, groupable:false}},
            {select:"T=", display:{id:"T", field:"T", width:210, name:"Time", filterable:false, groupable:false}},
            {select:"vrouter", display:{id:"vrouter",field:"vrouter", width:100, name:"Virtual Router", groupable:false}},
            {select:"sourcevn", display:{id:"sourcevn",field:"sourcevn", width:240, name:"Source VN", groupable:false}},
            {select:"destvn", display:{id:"destvn", field:"destvn", width:240, name:"Destination VN", groupable:false}},
            {select:"sourceip", display:{id:"sourceip", field:"sourceip", width:100, name:"Source IP", groupable:false}},
            {select:"destip", display:{id:"destip", field:"destip", width:120, name:"Destination IP", groupable:false}},
            {select:"sport", display:{id:"sport", field:"sport", width:100, name:"Source Port", groupable:false}},
            {select:"dport", display:{id:"dport", field:"dport", width:130, name:"Destination Port", groupable:false}},
            {select:"direction_ing", display:{id:"direction_ing", field:"direction_ing", width:100, name:"Direction", groupable:true}},
            {select:"protocol", display:{id:"protocol", field:"protocol", width:100, name:"Protocol", groupable:true}},
            {select:"bytes", display:{id:"bytes", field:"bytes", width:120, name:"Bytes", groupable:false}},
            {select:"sum(bytes)", display:{id:"sum(bytes)", field:"sum(bytes)", width:100, name:"SUM (Bytes)", groupable:false}},
            {select:"avg(bytes)", display:{id:"avg(bytes)", field:"avg(bytes)", width:100, name:"AVG (Bytes)", groupable:false}},
            {select:"packets", display:{id:"packets", field:"packets", width:100, name:"Packets", groupable:false}},
            {select:"sum(packets)", display:{id:"sum(packets)", field:"sum(packets)", width:120, name:"SUM (Packets)", groupable:false}},
            {select:"avg(packets)", display:{id:"avg(packets)", field:"avg(packets)", width:120, name:"AVG (Packets)", groupable:false}},
            {select:"flow_count", display:{id:"flow_count", field:"flow_count", width:120, name:"Flow Count", groupable:false}}
        ],
        "FlowRecordTable": [
            {select:"action", display:{id:"action", field:"action", width:60, name:"Action", groupable:true}},
            {select:"setup_time", display:{id:"setup_time", field:"setup_time", width:210, name:"Setup Time", filterable:false, groupable:false}},
            {select:"teardown_time", display:{id:"teardown_time", field:"teardown_time", width:210, name:"Teardown Time", filterable:false, groupable:false}},
            {select:"vrouter", display:{id:"vrouter", field:"vrouter", width:100, name:"Virtual Router", groupable:false}},
            {select:"vrouter_ip", display:{id:"vrouter_ip", field:"vrouter_ip", width:120, name:"Virtual Router IP", groupable:true}},
            {select:"other_vrouter_ip", display:{id:"other_vrouter_ip", field:"other_vrouter_ip", width:170, name:"Other Virtual Router IP", groupable:true}},
            {select:"sourcevn", display:{id:"sourcevn", field:"sourcevn", width:240, name:"Source VN", groupable:true}},
            {select:"destvn", display:{id:"destvn", field:"destvn", width:240, name:"Destination VN", groupable:true}},
            {select:"sourceip", display:{id:"sourceip", field:"sourceip", width:100, name:"Source IP", groupable:true}},
            {select:"destip", display:{id:"destip", field:"destip", width:120, name:"Destination IP", groupable:true}},
            {select:"sport", display:{id:"sport", field:"sport", width:100, name:"Source Port", groupable:true}},
            {select:"dport", display:{id:"dport", field:"dport", width:130, name:"Destination Port", groupable:true}},
            {select:"direction_ing", display:{id:"direction_ing", field:"direction_ing", width:100, name:"Direction", groupable:true}},
            {select:"protocol", display:{id:"protocol", field:"protocol", width:100, name:"Protocol", groupable:true}},
            {select:"underlay_proto", display:{id:"underlay_proto", field:"underlay_proto", width:150, name:"Underlay Protocol", groupable:true}},
            {select:"underlay_source_port", display:{id:"underlay_source_port", field:"underlay_source_port", width:150, name:"Underlay Source Port", groupable:true}},
            {select:"UuidKey", display:{id:"UuidKey", field:"UuidKey", width:280, name:"UUID", groupable:true}},
            {select:"sg_rule_uuid", display:{id:"sg_rule_uuid", field:"sg_rule_uuid", width:280, name:"Rule UUID", groupable:true}},
            {select:"nw_ace_uuid", display:{id:"nw_ace_uuid", field:"nw_ace_uuid", width:280, name:"Network UUID", groupable:true}},
            {select:"agg-bytes", display:{id:"agg-bytes", field:"agg-bytes", width:120, name:"Aggregate Bytes",  groupable:false}},
            {select:"agg-packets", display:{id:"agg-packets", field:"agg-packets", width:140, name:"Aggregate Packets",  groupable:false}},
            {select:"vmi_uuid", display:{id:"vmi_uuid", field:"vmi_uuid", width:140, name:"VMI UUID",  groupable:false}},
            {select:"drop_reason", display:{id:"drop_reason", field:"drop_reason", width:140, name:"Drop Reason",  groupable:false}}
        ],
        "StatTable.AnalyticsCpuState.cpu_info" : [
            {select:"cpu_info.module_id", display:{id:'cpu_info.module_id', field:'cpu_info.module_id', width:150, name:"Module Id", groupable:false}},
            {select:"cpu_info.inst_id", display:{id:'cpu_info.inst_id', field:'cpu_info.inst_id', width:150, name:"Instance Id", groupable:false}},
            {select:"COUNT(cpu_info)", display:{id:'COUNT(cpu_info)', field:'COUNT(cpu_info)', width:120, name:"Count (CPU Info)", groupable:false}},

            {select:"cpu_info.mem_virt", display:{id:'cpu_info.mem_virt', field:'cpu_info.mem_virt', width:150, name:"Virtual Memory", groupable:false}},
            {select:"SUM(cpu_info.mem_virt)", display:{id:'SUM(cpu_info.mem_virt)', field:'SUM(cpu_info.mem_virt)', width:150, name:"SUM (Virtual Memory)", groupable:false}},
            {select:"MIN(cpu_info.mem_virt)", display:{id:'MIN(cpu_info.mem_virt)', field:'MIN(cpu_info.mem_virt)', width:150, name:"MIN (Virtual Memory)", groupable:false}},
            {select:"MAX(cpu_info.mem_virt)", display:{id:'MAX(cpu_info.mem_virt)', field:'MAX(cpu_info.mem_virt)', width:150, name:"MAX (Virtual Memory)", groupable:false}},

            {select:"cpu_info.cpu_share", display:{id:'cpu_info.cpu_share', field:'cpu_info.cpu_share', width:120, name:"CPU Share", groupable:false}},
            {select:"SUM(cpu_info.cpu_share)", display:{id:'SUM(cpu_info.cpu_share)', field:'SUM(cpu_info.cpu_share)', width:150, name:"SUM (CPU Share)", groupable:false}},
            {select:"MIN(cpu_info.cpu_share)", display:{id:'MIN(cpu_info.cpu_share)', field:'MIN(cpu_info.cpu_share)', width:150, name:"MIN (CPU Share)", groupable:false}},
            {select:"MAX(cpu_info.cpu_share)", display:{id:'MAX(cpu_info.cpu_share)', field:'MAX(cpu_info.cpu_share)', width:150, name:"MAX (CPU Share)", groupable:false}},

            {select:"cpu_info.mem_res", display:{id:'cpu_info.mem_res', field:'cpu_info.mem_res', width:170, name:"CPU Resident Mem", groupable:false}},
            {select:"SUM(cpu_info.mem_res)", display:{id:'SUM(cpu_info.mem_res)', field:'SUM(cpu_info.mem_res)', width:190, name:"SUM (CPU Resident Mem)", groupable:false}},
            {select:"MIN(cpu_info.mem_res)", display:{id:'MIN(cpu_info.mem_res)', field:'MIN(cpu_info.mem_res)', width:190, name:"MIN (CPU Resident Mem)", groupable:false}},
            {select:"MAX(cpu_info.mem_res)", display:{id:'MAX(cpu_info.mem_res)', field:'MAX(cpu_info.mem_res)', width:190, name:"MAX (CPU Resident Mem)", groupable:false}}
        ],
        "StatTable.ConfigCpuState.cpu_info" : [
            {select:"cpu_info.module_id", display:{id:'cpu_info.module_id', field:'cpu_info.module_id', width:150, name:"Module Id", groupable:false}},
            {select:"cpu_info.inst_id", display:{id:'cpu_info.inst_id', field:'cpu_info.inst_id', width:150, name:"Instance Id", groupable:false}},
            {select:"COUNT(cpu_info)", display:{id:'COUNT(cpu_info)', field:'COUNT(cpu_info)', width:120, name:"Count (CPU Info)", groupable:false}},
            {select:"cpu_info.mem_virt", display:{id:'cpu_info.mem_virt', field:'cpu_info.mem_virt', width:150, name:"Virtual Memory", groupable:false}},
            {select:"SUM(cpu_info.mem_virt)", display:{id:'SUM(cpu_info.mem_virt)', field:'SUM(cpu_info.mem_virt)', width:150, name:"SUM (Virtual Memory)", groupable:false}},
            {select:"MIN(cpu_info.mem_virt)", display:{id:'MIN(cpu_info.mem_virt)', field:'MIN(cpu_info.mem_virt)', width:150, name:"MIN (Virtual Memory)", groupable:false}},
            {select:"MAX(cpu_info.mem_virt)", display:{id:'MAX(cpu_info.mem_virt)', field:'MAX(cpu_info.mem_virt)', width:150, name:"MAX (Virtual Memory)", groupable:false}},

            {select:"cpu_info.cpu_share", display:{id:'cpu_info.cpu_share', field:'cpu_info.cpu_share', width:150, name:"CPU Share", groupable:false}},
            {select:"SUM(cpu_info.cpu_share)", display:{id:'SUM(cpu_info.cpu_share)', field:'SUM(cpu_info.cpu_share)', width:150, name:"SUM (CPU Share)", groupable:false}},
            {select:"MIN(cpu_info.cpu_share)", display:{id:'MIN(cpu_info.cpu_share)', field:'MIN(cpu_info.cpu_share)', width:150, name:"MIN (CPU Share)", groupable:false}},
            {select:"MAX(cpu_info.cpu_share)", display:{id:'MAX(cpu_info.cpu_share)', field:'MAX(cpu_info.cpu_share)', width:150, name:"MAX (CPU Share)", groupable:false}},

            {select:"cpu_info.mem_res", display:{id:'cpu_info.mem_res', field:'cpu_info.mem_res', width:170, name:"CPU Resident Mem", groupable:false}},
            {select:"SUM(cpu_info.mem_res)", display:{id:'SUM(cpu_info.mem_res)', field:'SUM(cpu_info.mem_res)', width:190, name:"SUM (CPU Resident Mem)", groupable:false}},
            {select:"MIN(cpu_info.mem_res)", display:{id:'MIN(cpu_info.mem_res)', field:'MIN(cpu_info.mem_res)', width:190, name:"MIN (CPU Resident Mem)", groupable:false}},
            {select:"MAX(cpu_info.mem_res)", display:{id:'MAX(cpu_info.mem_res)', field:'MAX(cpu_info.mem_res)', width:190, name:"MAX (CPU Resident Mem)", groupable:false}}
        ],
        "StatTable.ControlCpuState.cpu_info" : [
            {select:"COUNT(cpu_info)", display:{id:'COUNT(cpu_info)', field:'COUNT(cpu_info)', width:120, name:"Count (CPU Info)", groupable:false}},
            {select:"cpu_info.mem_virt", display:{id:'cpu_info.mem_virt', field:'cpu_info.mem_virt', width:120, name:"Virtual Memory", groupable:false}},
            {select:"SUM(cpu_info.mem_virt)", display:{id:'SUM(cpu_info.mem_virt)', field:'SUM(cpu_info.mem_virt)', width:150, name:"SUM (Virtual Memory)", groupable:false}},
            {select:"MIN(cpu_info.mem_virt)", display:{id:'MIN(cpu_info.mem_virt)', field:'MIN(cpu_info.mem_virt)', width:150, name:"MIN (Virtual Memory)", groupable:false}},
            {select:"MAX(cpu_info.mem_virt)", display:{id:'MAX(cpu_info.mem_virt)', field:'MAX(cpu_info.mem_virt)', width:150, name:"MAX (Virtual Memory)", groupable:false}},

            {select:"cpu_info.cpu_share", display:{id:'cpu_info.cpu_share', field:'cpu_info.cpu_share', width:120, name:"CPU Share", groupable:false}},
            {select:"SUM(cpu_info.cpu_share)", display:{id:'SUM(cpu_info.cpu_share)', field:'SUM(cpu_info.cpu_share)', width:120, name:"SUM (CPU Share)", groupable:false}},
            {select:"MIN(cpu_info.cpu_share)", display:{id:'MIN(cpu_info.cpu_share)', field:'MIN(cpu_info.cpu_share)', width:120, name:"MIN (CPU Share)", groupable:false}},
            {select:"MAX(cpu_info.cpu_share)", display:{id:'MAX(cpu_info.cpu_share)', field:'MAX(cpu_info.cpu_share)', width:120, name:"MAX (CPU Share)", groupable:false}},

            {select:"cpu_info.mem_res", display:{id:'cpu_info.mem_res', field:'cpu_info.mem_res', width:170, name:"CPU Resident Mem", groupable:false}},
            {select:"SUM(cpu_info.mem_res)", display:{id:'SUM(cpu_info.mem_res)', field:'SUM(cpu_info.mem_res)', width:190, name:"SUM (CPU Resident Mem)", groupable:false}},
            {select:"MIN(cpu_info.mem_res)", display:{id:'MIN(cpu_info.mem_res)', field:'MIN(cpu_info.mem_res)', width:190, name:"MIN (CPU Resident Mem)", groupable:false}},
            {select:"MAX(cpu_info.mem_res)", display:{id:'MAX(cpu_info.mem_res)', field:'MAX(cpu_info.mem_res)', width:190, name:"MAX (CPU Resident Mem)", groupable:false}},

            {select:"cpu_info.inst_id", display:{id:'cpu_info.inst_id', field:'cpu_info.inst_id', width:120, name:"Instance Id", groupable:false}},
            {select:"cpu_info.module_id", display:{id:'cpu_info.module_id', field:'cpu_info.module_id', width:150, name:"Module Id", groupable:false}}

        ],
        "StatTable.PRouterEntry.ifStats" : [
            {select:"COUNT(ifStats)", display:{id:'COUNT(ifStats)', field:'COUNT(Stats)', width:120, name:"Count (Intf Stats)", groupable:false}},
            {select:"ifStats.ifInUcastPkts", display:{id:'ifStats.ifInUcastPkts', field:'ifStats.ifInUcastPkts', width:120, name:"In Unicast Pkts", groupable:false}},
            {select:"SUM(ifStats.ifInUcastPkts)", display:{id:'SUM(ifStats.ifInUcastPkts)', field:'SUM(ifStats.ifInUcastPkts)', width:160, name:"SUM (In Unicast Pkts)", groupable:false}},
            {select:"MAX(ifStats.ifInUcastPkts)", display:{id:'MAX(ifStats.ifInUcastPkts)', field:'MAX(ifStats.ifInUcastPkts)', width:160, name:"MAX (In Unicast Pkts)", groupable:false}},
            {select:"MIN(ifStats.ifInUcastPkts)", display:{id:'MIN(ifStats.ifInUcastPkts)', field:'MIN(ifStats.ifInUcastPkts)', width:160, name:"MIN (In Unicast Pkts)", groupable:false}},

            {select:"ifStats.ifInMulticastPkts", display:{id:'ifStats.ifInMulticastPkts', field:'ifStats.ifInMulticastPkts', width:120, name:"In Multicast Pkts", groupable:false}},
            {select:"SUM(ifStats.ifInMulticastPkts)", display:{id:'SUM(ifStats.ifInMulticastPkts)', field:'SUM(ifStats.ifInMulticastPkts)', width:160, name:"SUM (In Unicast Pkts)", groupable:false}},
            {select:"MAX(ifStats.ifInMulticastPkts)", display:{id:'MAX(ifStats.ifInMulticastPkts)', field:'MAX(ifStats.ifInMulticastPkts)', width:160, name:"MAX (In Unicast Pkts)", groupable:false}},
            {select:"MIN(ifStats.ifInMulticastPkts)", display:{id:'MIN(ifStats.ifInMulticastPkts)', field:'MIN(ifStats.ifInMulticastPkts)', width:160, name:"MIN (In Unicast Pkts)", groupable:false}},

            {select:"ifStats.ifInBroadcastPkts", display:{id:'ifStats.ifInBroadcastPkts', field:'ifStats.ifInBroadcastPkts', width:120, name:"In Broadcast Pkts", groupable:false}},
            {select:"SUM(ifStats.ifInBroadcastPkts)", display:{id:'SUM(ifStats.ifInBroadcastPkts)', field:'SUM(ifStats.ifInBroadcastPkts)', width:160, name:"SUM (In Broadcast Pkts)", groupable:false}},
            {select:"MAX(ifStats.ifInBroadcastPkts)", display:{id:'MAX(ifStats.ifInBroadcastPkts)', field:'MAX(ifStats.ifInBroadcastPkts)', width:160, name:"MAX (In Broadcast Pkts)", groupable:false}},
            {select:"MIN(ifStats.ifInBroadcastPkts)", display:{id:'MIN(ifStats.ifInBroadcastPkts)', field:'MIN(ifStats.ifInBroadcastPkts)', width:160, name:"MIN (In Broadcast Pkts)", groupable:false}},

            {select:"ifStats.ifInDiscards", display:{id:'ifStats.ifInDiscards', field:'ifStats.ifInDiscards', width:120, name:"Intf In Discards", groupable:false}},
            {select:"SUM(ifStats.ifInDiscards)", display:{id:'SUM(ifStats.ifInDiscards)', field:'SUM(ifStats.ifInDiscards)', width:160, name:"SUM (Intf In Discards)", groupable:false}},
            {select:"MAX(ifStats.ifInDiscards)", display:{id:'MAX(ifStats.ifInDiscards)', field:'MAX(ifStats.ifInDiscards)', width:160, name:"MAX (Intf In Discards)", groupable:false}},
            {select:"MIN(ifStats.ifInDiscards)", display:{id:'MIN(ifStats.ifInDiscards)', field:'MIN(ifStats.ifInDiscards)', width:160, name:"MIN (Intf In Discards)", groupable:false}},

            {select:"ifStats.ifInErrors", display:{id:'ifStats.ifInErrors', field:'ifStats.ifInErrors', width:120, name:"Intf In Errors", groupable:false}},
            {select:"SUM(ifStats.ifInErrors)", display:{id:'SUM(ifStats.ifInErrors)', field:'SUM(ifStats.ifInErrors)', width:160, name:"SUM (Intf In Errors)", groupable:false}},
            {select:"MAX(ifStats.ifInErrors)", display:{id:'MAX(ifStats.ifInErrors)', field:'MAX(ifStats.ifInErrors)', width:160, name:"MAX (Intf In Errors)", groupable:false}},
            {select:"MIN(ifStats.ifInErrors)", display:{id:'MIN(ifStats.ifInErrors)', field:'MIN(ifStats.ifInErrors)', width:160, name:"MIN (Intf In Errors)", groupable:false}},

            {select:"ifStats.ifOutUcastPkts", display:{id:'ifStats.ifOutUcastPkts', field:'ifStats.ifOutUcastPkts', width:120, name:"Out Unicast Pkts", groupable:false}},
            {select:"SUM(ifStats.ifOutUcastPkts)", display:{id:'SUM(ifStats.ifOutUcastPkts)', field:'SUM(ifStats.ifOutUcastPkts)', width:160, name:"SUM (Out Unicast Pkts)", groupable:false}},
            {select:"MAX(ifStats.ifOutUcastPkts)", display:{id:'MAX(ifStats.ifOutUcastPkts)', field:'MAX(ifStats.ifOutUcastPkts)', width:160, name:"MAX (Out Unicast Pkts)", groupable:false}},
            {select:"MIN(ifStats.ifOutUcastPkts)", display:{id:'MIN(ifStats.ifOutUcastPkts)', field:'MIN(ifStats.ifOutUcastPkts)', width:160, name:"MIN (Out Unicast Pkts)", groupable:false}},

            {select:"ifStats.ifOutMulticastPkts", display:{id:'ifStats.ifOutMulticastPkts', field:'ifStats.ifOutMulticastPkts', width:120, name:"Out Multicast Pkts", groupable:false}},
            {select:"SUM(ifStats.ifOutMulticastPkts)", display:{id:'SUM(ifStats.ifOutMulticastPkts)', field:'SUM(ifStats.ifOutMulticastPkts)', width:160, name:"SUM (Out Multicast Pkts)", groupable:false}},
            {select:"MAX(ifStats.ifOutMulticastPkts)", display:{id:'MAX(ifStats.ifOutMulticastPkts)', field:'MAX(ifStats.ifOutMulticastPkts)', width:160, name:"MAX (Out Multicast Pkts)", groupable:false}},
            {select:"MIN(ifStats.ifOutMulticastPkts)", display:{id:'MIN(ifStats.ifOutMulticastPkts)', field:'MIN(ifStats.ifOutMulticastPkts)', width:160, name:"MIN (Out Multicast Pkts)", groupable:false}},

            {select:"ifStats.ifOutBroadcastPkts", display:{id:'ifStats.ifOutBroadcastPkts', field:'ifStats.ifOutBroadcastPkts', width:120, name:"Out Broadcast Pkts", groupable:false}},
            {select:"SUM(ifStats.ifOutBroadcastPkts)", display:{id:'SUM(ifStats.ifOutBroadcastPkts)', field:'SUM(ifStats.ifOutBroadcastPkts)', width:160, name:"SUM (Out Broadcast Pkts)", groupable:false}},
            {select:"MAX(ifStats.ifOutBroadcastPkts)", display:{id:'MAX(ifStats.ifOutBroadcastPkts)', field:'MAX(ifStats.ifOutBroadcastPkts)', width:160, name:"MAX (Out Broadcast Pkts)", groupable:false}},
            {select:"MIN(ifStats.ifOutBroadcastPkts)", display:{id:'MIN(ifStats.ifOutBroadcastPkts)', field:'MIN(ifStats.ifOutBroadcastPkts)', width:160, name:"MIN (Out Broadcast Pkts)", groupable:false}},

            {select:"ifStats.ifOutDiscards", display:{id:'ifStats.ifOutDiscards', field:'ifStats.ifOutDiscards', width:120, name:"Intf Out Discards", groupable:false}},
            {select:"SUM(ifStats.ifOutDiscards)", display:{id:'SUM(ifStats.ifOutDiscards)', field:'SUM(ifStats.ifOutDiscards)', width:160, name:"SUM (Intf Out Discards)", groupable:false}},
            {select:"MAX(ifStats.ifOutDiscards)", display:{id:'MAX(ifStats.ifOutDiscards)', field:'MAX(ifStats.ifOutDiscards)', width:160, name:"MAX (Intf Out Discards)", groupable:false}},
            {select:"MIN(ifStats.ifOutDiscards)", display:{id:'MIN(ifStats.ifOutDiscards)', field:'MIN(ifStats.ifOutDiscards)', width:160, name:"MIN (Intf Out Discards)", groupable:false}},

            {select:"ifStats.ifOutErrors", display:{id:'ifStats.ifOutErrors', field:'ifStats.ifOutErrors', width:120, name:"Intf Out Errors", groupable:false}},
            {select:"SUM(ifStats.ifOutErrors)", display:{id:'SUM(ifStats.ifOutErrors)', field:'SUM(ifStats.ifOutErrors)', width:160, name:"SUM (Intf Out Errors)", groupable:false}},
            {select:"MAX(ifStats.ifOutErrors)", display:{id:'MAX(ifStats.ifOutErrors)', field:'MAX(ifStats.ifOutErrors)', width:160, name:"MAX (Intf Out Errors)", groupable:false}},
            {select:"MIN(ifStats.ifOutErrors)", display:{id:'MIN(ifStats.ifOutErrors)', field:'MIN(ifStats.ifOutErrors)', width:160, name:"MIN (Intf Out Errors)", groupable:false}},

            {select:"ifStats.ifIndex", display:{id:'ifStats.ifIndex', field:'ifStats.ifIndex', width:120, name:"Intf Index", groupable:false}},
            {select:"SUM(ifStats.ifIndex)", display:{id:'SUM(ifStats.ifIndex)', field:'SUM(ifStats.ifIndex)', width:160, name:"SUM (Intf Index)", groupable:false}},
            {select:"MAX(ifStats.ifIndex)", display:{id:'MAX(ifStats.ifIndex)', field:'MAX(ifStats.ifIndex)', width:160, name:"MAX (Intf Index)", groupable:false}},
            {select:"MIN(ifStats.ifIndex)", display:{id:'MIN(ifStats.ifIndex)', field:'MIN(ifStats.ifIndex)', width:160, name:"MIN (Intf Index)", groupable:false}}
        ],
        "StatTable.ComputeCpuState.cpu_info" : [
            {select:"COUNT(cpu_info)", display:{id:'COUNT(cpu_info)', field:'COUNT(cpu_info)', width:120, name:"Count (CPU Info)", groupable:false}},

            {select:"cpu_info.mem_virt", display:{id:'cpu_info.mem_virt', field:'cpu_info.mem_virt', width:160, name:"Virtual Memory", groupable:false}},
            {select:"SUM(cpu_info.mem_virt)", display:{id:'SUM(cpu_info.mem_virt)', field:'SUM(cpu_info.mem_virt)', width:160, name:"SUM (Virtual Memory)", groupable:false}},
            {select:"MAX(cpu_info.mem_virt)", display:{id:'MAX(cpu_info.mem_virt)', field:'MAX(cpu_info.mem_virt)', width:160, name:"MAX (Virtual Memory)", groupable:false}},
            {select:"MIN(cpu_info.mem_virt)", display:{id:'MIN(cpu_info.mem_virt)', field:'MIN(cpu_info.mem_virt)', width:160, name:"MIN (Virtual Memory)", groupable:false}},

            {select:"cpu_info.cpu_share", display:{id:'cpu_info.cpu_share', field:'cpu_info.cpu_share', width:160, name:"CPU Share", groupable:false}},
            {select:"SUM(cpu_info.cpu_share)", display:{id:'SUM(cpu_info.cpu_share)', field:'SUM(cpu_info.cpu_share)', width:160, name:"SUM (CPU Share)", groupable:false}},
            {select:"MAX(cpu_info.cpu_share)", display:{id:'MAX(cpu_info.cpu_share)', field:'MAX(cpu_info.cpu_share)', width:160, name:"MAX (CPU Share)", groupable:false}},
            {select:"MIN(cpu_info.cpu_share)", display:{id:'MIN(cpu_info.cpu_share)', field:'MIN(cpu_info.cpu_share)', width:160, name:"MIN (CPU Share)", groupable:false}},


            {select:"cpu_info.used_sys_mem", display:{id:'cpu_info.used_sys_mem', field:'cpu_info.used_sys_mem', width:190, name:"CPU Sys Mem Used", groupable:false}},
            {select:"SUM(cpu_info.used_sys_mem)", display:{id:'SUM(cpu_info.used_sys_mem)', field:'SUM(cpu_info.used_sys_mem)', width:190, name:"SUM (CPU Sys Mem Used)", groupable:false}},
            {select:"MAX(cpu_info.used_sys_mem)", display:{id:'MAX(cpu_info.used_sys_mem)', field:'MAX(cpu_info.used_sys_mem)', width:190, name:"MAX (CPU Sys Mem Used)", groupable:false}},
            {select:"MIN(cpu_info.used_sys_mem)", display:{id:'MIN(cpu_info.used_sys_mem)', field:'MIN(cpu_info.used_sys_mem)', width:190, name:"MIN (CPU Sys Mem Used)", groupable:false}},

            {select:"cpu_info.one_min_cpuload", display:{id:'cpu_info.one_min_cpuload', field:'cpu_info.one_min_cpuload', width:160, name:"CPU 1 Min Load", groupable:false}},
            {select:"SUM(cpu_info.one_min_cpuload)", display:{id:'SUM(cpu_info.one_min_cpuload)', field:'SUM(cpu_info.one_min_cpuload)', width:160, name:"SUM (CPU 1 Min Load)", groupable:false}},
            {select:"MAX(cpu_info.one_min_cpuload)", display:{id:'MAX(cpu_info.one_min_cpuload)', field:'MAX(cpu_info.one_min_cpuload)', width:160, name:"MAX (CPU 1 Min Load)", groupable:false}},
            {select:"MIN(cpu_info.one_min_cpuload)", display:{id:'MIN(cpu_info.one_min_cpuload)', field:'MIN(cpu_info.one_min_cpuload)', width:160, name:"MIN (CPU 1 Min Load)", groupable:false}},

            {select:"cpu_info.mem_res", display:{id:'cpu_info.mem_res', field:'cpu_info.mem_res', width:170, name:"CPU Resident Mem", groupable:false}},
            {select:"SUM(cpu_info.mem_res)", display:{id:'SUM(cpu_info.mem_res)', field:'SUM(cpu_info.mem_res)', width:190, name:"SUM (CPU Resident Mem)", groupable:false}},
            {select:"MIN(cpu_info.mem_res)", display:{id:'MIN(cpu_info.mem_res)', field:'MIN(cpu_info.mem_res)', width:190, name:"MIN (CPU Resident Mem)", groupable:false}},
            {select:"MAX(cpu_info.mem_res)", display:{id:'MAX(cpu_info.mem_res)', field:'MAX(cpu_info.mem_res)', width:190, name:"MAX (CPU Resident Mem)", groupable:false}}
        ],
        "StatTable.VirtualMachineStats.cpu_stats" : [
            {select:"COUNT(cpu_stats)", display:{id:'COUNT(cpu_stats)', field:'COUNT(cpu_stats)', width:150, name:"Count (CPU Stats)", groupable:false}},

            {select:"cpu_stats.cpu_one_min_avg", display:{id:'cpu_stats.cpu_one_min_avg', field:'cpu_stats.cpu_one_min_avg', width:170, name:"Cpu One Min Avg", groupable:false}},
            {select:"SUM(cpu_stats.cpu_one_min_avg)", display:{id:'SUM(cpu_stats.cpu_one_min_avg)', field:'SUM(cpu_stats.cpu_one_min_avg)', width:170, name:"SUM (Cpu One Min Avg)", groupable:false}},
            {select:"MAX(cpu_stats.cpu_one_min_avg)", display:{id:'MAX(cpu_stats.cpu_one_min_avg)', field:'MAX(cpu_stats.cpu_one_min_avg)', width:170, name:"MAX (Cpu One Min Avg)", groupable:false}},
            {select:"MIN(cpu_stats.cpu_one_min_avg)", display:{id:'MIN(cpu_stats.cpu_one_min_avg)', field:'MIN(cpu_stats.cpu_one_min_avg)', width:170, name:"MIN (Cpu One Min Avg)", groupable:false}},

            {select:"cpu_stats.vm_memory_quota", display:{id:'cpu_stats.vm_memory_quota', field:'cpu_stats.vm_memory_quota', width:190, name:"Vm Memory Quota", groupable:false}},
            {select:"SUM(cpu_stats.vm_memory_quota)", display:{id:'SUM(cpu_stats.vm_memory_quota)', field:'SUM(cpu_stats.vm_memory_quota)', width:190, name:"SUM (Vm Memory Quota)", groupable:false}},
            {select:"MAX(cpu_stats.vm_memory_quota)", display:{id:'MAX(cpu_stats.vm_memory_quota)', field:'MAX(cpu_stats.vm_memory_quota)', width:190, name:"MAX (Vm Memory Quota)", groupable:false}},
            {select:"MIN(cpu_stats.vm_memory_quota)", display:{id:'MIN(cpu_stats.vm_memory_quota)', field:'MIN(cpu_stats.vm_memory_quota)', width:190, name:"MIN (Vm Memory Quota)", groupable:false}},

            {select:"cpu_stats.rss", display:{id:'cpu_stats.rss', field:'cpu_stats.rss', width:150, name:"Rss", groupable:false}},
            {select:"SUM(cpu_stats.rss)", display:{id:'SUM(cpu_stats.rss)', field:'SUM(cpu_stats.rss)', width:150, name:"SUM (Rss)", groupable:false}},
            {select:"MAX(cpu_stats.rss)", display:{id:'MAX(cpu_stats.rss)', field:'MAX(cpu_stats.rss)', width:150, name:"MAX (Rss)", groupable:false}},
            {select:"MIN(cpu_stats.rss)", display:{id:'MIN(cpu_stats.rss)', field:'MIN(cpu_stats.rss)', width:150, name:"MIN (Rss)", groupable:false}},

            {select:"cpu_stats.virt_memory", display:{id:'cpu_stats.virt_memory', field:'cpu_stats.virt_memory', width:150, name:"Virtual Mem", groupable:false}},
            {select:"SUM(cpu_stats.virt_memory)", display:{id:'SUM(cpu_stats.virt_memory)', field:'SUM(cpu_stats.virt_memory)', width:150, name:"SUM (Virtual Mem)", groupable:false}},
            {select:"MAX(cpu_stats.virt_memory)", display:{id:'MAX(cpu_stats.virt_memory)', field:'MAX(cpu_stats.virt_memory)', width:150, name:"MAX (Virtual Mem)", groupable:false}},
            {select:"MIN(cpu_stats.virt_memory)", display:{id:'MIN(cpu_stats.virt_memory)', field:'MIN(cpu_stats.virt_memory)', width:150, name:"MIN (Virtual Mem)", groupable:false}},

            {select:"cpu_stats.peak_virt_memory", display:{id:'cpu_stats.peak_virt_memory', field:'cpu_stats.peak_virt_memory', width:170, name:"Peak Virtual Mem", groupable:false}},
            {select:"SUM(cpu_stats.peak_virt_memory)", display:{id:'SUM(cpu_stats.peak_virt_memory)', field:'SUM(cpu_stats.peak_virt_memory)', width:170, name:"SUM (Peak Virtual Mem)", groupable:false}},
            {select:"MAX(cpu_stats.peak_virt_memory)", display:{id:'MAX(cpu_stats.peak_virt_memory)', field:'MAX(cpu_stats.peak_virt_memory)', width:170, name:"MAX (Peak Virtual Mem)", groupable:false}},
            {select:"MIN(cpu_stats.peak_virt_memory)", display:{id:'MIN(cpu_stats.peak_virt_memory)', field:'MIN(cpu_stats.peak_virt_memory)', width:170, name:"MIN (Peak Virtual Mem)", groupable:false}},
        ],
        "StatTable.ComputeStoragePool.info_stats" : [
            {select:"COUNT(info_stats)", display:{id:'COUNT(info_stats)', field:'COUNT(info_stats)', width:150, name:"Count (Info Stats)", groupable:false}},

            {select:"info_stats.writes", display:{id:'info_stats.reads', field:'info_stats.reads', width:150, name:"Reads", groupable:false}},
            {select:"SUM(info_stats.reads)", display:{id:'SUM(info_stats.reads)', field:'SUM(info_stats.reads)', width:150, name:"SUM (Reads)", groupable:false}},
            {select:"MAX(info_stats.reads)", display:{id:'MAX(info_stats.reads)', field:'MAX(info_stats.reads)', width:150, name:"MAX (Reads)", groupable:false}},
            {select:"MIN(info_stats.reads)", display:{id:'MIN(info_stats.reads)', field:'MIN(info_stats.reads)', width:150, name:"MIN (Reads)", groupable:false}},

            {select:"info_stats.writes", display:{id:'info_stats.writes', field:'info_stats.writes', width:150, name:"Writes", groupable:false}},
            {select:"SUM(info_stats.writes)", display:{id:'SUM(info_stats.writes)', field:'SUM(info_stats.writes)', width:150, name:"SUM (writes)", groupable:false}},
            {select:"MAX(info_stats.writes)", display:{id:'MAX(info_stats.writes)', field:'MAX(info_stats.writes)', width:150, name:"MAX (writes)", groupable:false}},
            {select:"MIN(info_stats.writes)", display:{id:'MIN(info_stats.writes)', field:'MIN(info_stats.writes)', width:150, name:"MIN (writes)", groupable:false}},

            {select:"info_stats.read_kbytes", display:{id:'info_stats.read_kbytes', field:'info_stats.read_kbytes', width:150, name:"Read kbytes", groupable:false}},
            {select:"SUM(info_stats.read_kbytes)", display:{id:'SUM(info_stats.read_kbytes)', field:'SUM(info_stats.read_kbytes)', width:150, name:"SUM (Read kbytes)", groupable:false}},
            {select:"MAX(info_stats.read_kbytes)", display:{id:'MAX(info_stats.read_kbytes)', field:'MAX(info_stats.read_kbytes)', width:150, name:"MAX (Read kbytes)", groupable:false}},
            {select:"MIN(info_stats.read_kbytes)", display:{id:'MIN(info_stats.read_kbytes)', field:'MIN(info_stats.read_kbytes)', width:150, name:"MIN (Read kbytes)", groupable:false}},

            {select:"info_stats.write_kbytes", display:{id:'info_stats.write_kbytes', field:'info_stats.write_kbytes', width:150, name:"Write kbytes", groupable:false}},
            {select:"SUM(info_stats.write_kbytes)", display:{id:'SUM(info_stats.write_kbytes)', field:'SUM(info_stats.write_kbytes)', width:150, name:"SUM (Write kbytes)", groupable:false}},
            {select:"MAX(info_stats.write_kbytes)", display:{id:'MAX(info_stats.write_kbytes)', field:'MAX(info_stats.write_kbytes)', width:150, name:"MAX (Write kbytes)", groupable:false}},
            {select:"MIN(info_stats.write_kbytes)", display:{id:'MIN(info_stats.write_kbytes)', field:'MIN(info_stats.write_kbytes)', width:150, name:"MIN (Write kbytes)", groupable:false}}

        ],
        "StatTable.ComputeStorageOsd.info_stats" : [
            {select:"COUNT(info_stats)", display:{id:'COUNT(info_stats)', field:'COUNT(info_stats)', width:150, name:"Count (Info Stats)", groupable:false}},

            {select:"info_stats.reads", display:{id:'info_stats.reads', field:'info_stats.reads', width:150, name:"Reads", groupable:false}},
            {select:"SUM(info_stats.reads)", display:{id:'SUM(info_stats.reads)', field:'SUM(info_stats.reads)', width:150, name:"SUM (Reads)", groupable:false}},
            {select:"MAX(info_stats.reads)", display:{id:'MAX(info_stats.reads)', field:'MAX(info_stats.reads)', width:150, name:"MAX (Reads)", groupable:false}},
            {select:"MIN(info_stats.reads)", display:{id:'MIN(info_stats.reads)', field:'MIN(info_stats.reads)', width:150, name:"MIN (Reads)", groupable:false}},

            {select:"info_stats.writes", display:{id:'info_stats.writes', field:'info_stats.writes', width:150, name:"Writes", groupable:false}},
            {select:"SUM(info_stats.writes)", display:{id:'SUM(info_stats.writes)', field:'SUM(info_stats.writes)', width:150, name:"SUM (Writes)", groupable:false}},
            {select:"MAX(info_stats.writes)", display:{id:'MAX(info_stats.writes)', field:'MAX(info_stats.writes)', width:150, name:"MAX (Writes)", groupable:false}},
            {select:"MIN(info_stats.writes)", display:{id:'MIN(info_stats.writes)', field:'MIN(info_stats.writes)', width:150, name:"MIN (Writes)", groupable:false}},

            {select:"info_stats.read_kbytes", display:{id:'info_stats.read_kbytes', field:'info_stats.read_kbytes', width:150, name:"Read kbytes", groupable:false}},
            {select:"SUM(info_stats.read_kbytes)", display:{id:'SUM(info_stats.read_kbytes)', field:'SUM(info_stats.read_kbytes)', width:150, name:"SUM (Read kbytes)", groupable:false}},
            {select:"MAX(info_stats.read_kbytes)", display:{id:'MAX(info_stats.read_kbytes)', field:'MAX(info_stats.read_kbytes)', width:150, name:"MAX (Read kbytes)", groupable:false}},
            {select:"MIN(info_stats.read_kbytes)", display:{id:'MIN(info_stats.read_kbytes)', field:'MIN(info_stats.read_kbytes)', width:150, name:"MIN (Read kbytes)", groupable:false}},

            {select:"info_stats.write_kbytes", display:{id:'info_stats.write_kbytes', field:'info_stats.write_kbytes', width:150, name:"Write kbytes", groupable:false}},
            {select:"SUM(info_stats.write_kbytes)", display:{id:'SUM(info_stats.write_kbytes)', field:'SUM(info_stats.write_kbytes)', width:150, name:"SUM (Write kbytes)", groupable:false}},
            {select:"MAX(info_stats.write_kbytes)", display:{id:'MAX(info_stats.write_kbytes)', field:'MAX(info_stats.write_kbytes)', width:150, name:"MAX (Write kbytes)", groupable:false}},
            {select:"MIN(info_stats.write_kbytes)", display:{id:'MIN(info_stats.write_kbytes)', field:'MIN(info_stats.write_kbytes)', width:150, name:"MIN (Write kbytes)", groupable:false}},

            {select:"info_stats.op_r_latency", display:{id:'info_stats.op_r_latency', field:'info_stats.op_r_latency', width:150, name:"Read Latency", groupable:false}},
            {select:"SUM(info_stats.op_r_latency)", display:{id:'SUM(info_stats.op_r_latency)', field:'SUM(info_stats.op_r_latency)', width:150, name:"SUM (Read Latency)", groupable:false}},
            {select:"MAX(info_stats.op_r_latency)", display:{id:'MAX(info_stats.op_r_latency)', field:'MAX(info_stats.op_r_latency)', width:150, name:"MAX (Read Latency)", groupable:false}},
            {select:"MIN(info_stats.op_r_latency)", display:{id:'MIN(info_stats.op_r_latency)', field:'MIN(info_stats.op_r_latency)', width:150, name:"MIN (Read Latency)", groupable:false}},

            {select:"info_stats.op_w_latency", display:{id:'info_stats.op_w_latency', field:'info_stats.op_w_latency', width:150, name:"Read Latency", groupable:false}},
            {select:"SUM(info_stats.op_w_latency)", display:{id:'SUM(info_stats.op_w_latency)', field:'SUM(info_stats.op_w_latency)', width:150, name:"SUM (Read Latency)", groupable:false}},
            {select:"MAX(info_stats.op_w_latency)", display:{id:'MAX(info_stats.op_w_latency)', field:'MAX(info_stats.op_w_latency)', width:150, name:"MAX (Read Latency)", groupable:false}},
            {select:"MIN(info_stats.op_w_latency)", display:{id:'MIN(info_stats.op_w_latency)', field:'MIN(info_stats.op_w_latency)', width:150, name:"MIN (Read Latency)", groupable:false}}
        ],
        "StatTable.ComputeStorageDisk.info_stats" : [
            {select:"COUNT(info_stats)", display:{id:'COUNT(info_stats)', field:'COUNT(info_stats)', width:150, name:"Count (Info Stats)", groupable:false}},

            {select:"info_stats.reads", display:{id:'info_stats.reads', field:'info_stats.reads', width:150, name:"Reads", groupable:false}},
            {select:"SUM(info_stats.reads)", display:{id:'SUM(info_stats.reads)', field:'SUM(info_stats.reads)', width:150, name:"SUM (Reads)", groupable:false}},
            {select:"MAX(info_stats.reads)", display:{id:'MAX(info_stats.reads)', field:'MAX(info_stats.reads)', width:150, name:"MAX (Reads)", groupable:false}},
            {select:"MIN(info_stats.reads)", display:{id:'MIN(info_stats.reads)', field:'MIN(info_stats.reads)', width:150, name:"MIN (Reads)", groupable:false}},

            {select:"info_stats.writes", display:{id:'info_stats.writes', field:'info_stats.writes', width:150, name:"Writes", groupable:false}},
            {select:"SUM(info_stats.writes)", display:{id:'SUM(info_stats.writes)', field:'SUM(info_stats.writes)', width:150, name:"SUM (Writes)", groupable:false}},
            {select:"MAX(info_stats.writes)", display:{id:'MAX(info_stats.writes)', field:'MAX(info_stats.writes)', width:150, name:"MAX (Writes)", groupable:false}},
            {select:"MIN(info_stats.writes)", display:{id:'MIN(info_stats.writes)', field:'MIN(info_stats.writes)', width:150, name:"MIN (Writes)", groupable:false}},

            {select:"info_stats.read_kbytes", display:{id:'info_stats.read_kbytes', field:'info_stats.read_kbytes', width:150, name:"Read kbytes", groupable:false}},
            {select:"SUM(info_stats.read_kbytes)", display:{id:'SUM(info_stats.read_kbytes)', field:'SUM(info_stats.read_kbytes)', width:150, name:"SUM (Read kbytes)", groupable:false}},
            {select:"MAX(info_stats.read_kbytes)", display:{id:'MAX(info_stats.read_kbytes)', field:'MAX(info_stats.read_kbytes)', width:150, name:"MAX (Read kbytes)", groupable:false}},
            {select:"MIN(info_stats.read_kbytes)", display:{id:'MIN(info_stats.read_kbytes)', field:'MIN(info_stats.read_kbytes)', width:150, name:"MIN (Read kbytes)", groupable:false}},

            {select:"info_stats.write_kbytes", display:{id:'info_stats.write_kbytes', field:'info_stats.write_kbytes', width:150, name:"Write kbytes", groupable:false}},
            {select:"SUM(info_stats.write_kbytes)", display:{id:'SUM(info_stats.write_kbytes)', field:'SUM(info_stats.write_kbytes)', width:150, name:"SUM (Write kbytes)", groupable:false}},
            {select:"MAX(info_stats.write_kbytes)", display:{id:'MAX(info_stats.write_kbytes)', field:'MAX(info_stats.write_kbytes)', width:150, name:"MAX (Write kbytes)", groupable:false}},
            {select:"MIN(info_stats.write_kbytes)", display:{id:'MIN(info_stats.write_kbytes)', field:'MIN(info_stats.write_kbytes)', width:150, name:"MIN (Write kbytes)", groupable:false}},

            {select:"info_stats.iops", display:{id:'info_stats.iops', field:'info_stats.iops', width:150, name:"IOPS", groupable:false}},
            {select:"SUM(info_stats.iops)", display:{id:'SUM(info_stats.iops)', field:'SUM(info_stats.iops)', width:150, name:"SUM (IOPS)", groupable:false}},
            {select:"MAX(info_stats.iops)", display:{id:'MAX(info_stats.iops)', field:'MAX(info_stats.iops)', width:150, name:"MAX (IOPS)", groupable:false}},
            {select:"MIN(info_stats.iops)", display:{id:'MIN(info_stats.iops)', field:'MIN(info_stats.iops)', width:150, name:"MIN (IOPS)", groupable:false}},

            {select:"info_stats.bw", display:{id:'info_stats.bw', field:'info_stats.bw', width:150, name:"Bandwidth", groupable:false}},
            {select:"SUM(info_stats.bw)", display:{id:'SUM(info_stats.bw)', field:'SUM(info_stats.bw)', width:150, name:"SUM (Bandwidth)", groupable:false}},
            {select:"MAX(info_stats.bw)", display:{id:'MAX(info_stats.bw)', field:'MAX(info_stats.bw)', width:150, name:"MAX (Bandwidth)", groupable:false}},
            {select:"MIN(info_stats.bw)", display:{id:'MIN(info_stats.bw)', field:'MIN(info_stats.bw)', width:150, name:"MIN (Bandwidth)", groupable:false}},

            {select:"info_stats.op_r_latency", display:{id:'info_stats.op_r_latency', field:'info_stats.op_r_latency', width:170, name:"Op Read Latency", groupable:false}},
            {select:"SUM(info_stats.op_r_latency)", display:{id:'SUM(info_stats.op_r_latency)', field:'SUM(info_stats.op_r_latency)', width:170, name:"SUM (Op Read Latency)", groupable:false}},
            {select:"MAX(info_stats.op_r_latency)", display:{id:'MAX(info_stats.op_r_latency)', field:'MAX(info_stats.op_r_latency)', width:170, name:"MAX (Op Read Latency)", groupable:false}},
            {select:"MIN(info_stats.op_r_latency)", display:{id:'MIN(info_stats.op_r_latency)', field:'MIN(info_stats.op_r_latency)', width:170, name:"MIN (Op Read Latency)", groupable:false}},

            {select:"info_stats.op_w_latency", display:{id:'info_stats.op_w_latency', field:'info_stats.op_w_latency', width:170, name:"Op Write Latency", groupable:false}},
            {select:"SUM(info_stats.op_w_latency)", display:{id:'SUM(info_stats.op_w_latency)', field:'SUM(info_stats.op_w_latency)', width:170, name:"SUM (Op Write Latency)", groupable:false}},
            {select:"MAX(info_stats.op_w_latency)", display:{id:'MAX(info_stats.op_w_latency)', field:'MAX(info_stats.op_w_latency)', width:170, name:"MAX (Op Write Latency)", groupable:false}},
            {select:"MIN(info_stats.op_w_latency)", display:{id:'MIN(info_stats.op_w_latency)', field:'MIN(info_stats.op_w_latency)', width:170, name:"MIN (Op Write Latency)", groupable:false}}

        ],
        "StatTable.ServerMonitoringInfo.sensor_stats" : [
            {select:"COUNT(sensor_stats)", display:{id:'COUNT(sensor_stats)', field:'COUNT(sensor_stats)', width:150, name:"Count (Sensor Stats)", groupable:false}},
            {select:"sensor_stats.sensor", display:{id:'sensor_stats.sensor', field:'sensor_stats.sensor', width:150, name:"Sensor", groupable:false}},
            {select:"sensor_stats.status", display:{id:'sensor_stats.status', field:'sensor_stats.status', width:150, name:"Sensor Status", groupable:false}},

            {select:"sensor_stats.reading", display:{id:'sensor_stats.reading', field:'sensor_stats.reading', width:150, name:"Reading", groupable:false}},
            {select:"SUM(sensor_stats.reading)", display:{id:'SUM(sensor_stats.reading)', field:'SUM(sensor_stats.reading)', width:150, name:"SUM (Reading)", groupable:false}},
            {select:"MAX(sensor_stats.reading)", display:{id:'MAX(sensor_stats.reading)', field:'MAX(sensor_stats.reading)', width:150, name:"MAX (Reading)", groupable:false}},
            {select:"MIN(sensor_stats.reading)", display:{id:'MIN(sensor_stats.reading)', field:'MIN(sensor_stats.reading)', width:150, name:"MIN (Reading)", groupable:false}},

            {select:"sensor_stats.unit", display:{id:'sensor_stats.unit', field:'sensor_stats.unit', width:150, name:"Unit", groupable:false}},
            {select:"sensor_stats.sensor_type", display:{id:'sensor_stats.sensor_type', field:'sensor_stats.sensor_type', width:150, name:"Sensor Type", groupable:false}}
        ],
        "StatTable.ServerMonitoringInfo.disk_usage_stats" : [
            {select:"COUNT(disk_usage_stats)", display:{id:'COUNT(disk_usage_stats)', field:'COUNT(disk_usage_stats)', width:150, name:"Count (Disk Usage)", groupable:false}},
            {select:"disk_usage_stats.disk_name", display:{id:'disk_usage_stats.disk_name', field:'disk_usage_stats.disk_name', width:150, name:"Disk Name", groupable:false}},

            {select:"disk_usage_stats.read_bytes", display:{id:'disk_usage_stats.read_bytes', field:'disk_usage_stats.read_bytes', width:150, name:"Read MB", groupable:false}},
            {select:"SUM(disk_usage_stats.read_bytes)", display:{id:'SUM(disk_usage_stats.read_bytes)', field:'SUM(disk_usage_stats.read_bytes)', width:150, name:"SUM (Read MB)", groupable:false}},
            {select:"MAX(disk_usage_stats.read_bytes)", display:{id:'MAX(disk_usage_stats.read_bytes)', field:'MAX(disk_usage_stats.read_bytes)', width:150, name:"MAX (Read MB)", groupable:false}},
            {select:"MIN(disk_usage_stats.read_bytes)", display:{id:'MIN(disk_usage_stats.read_bytes)', field:'MIN(disk_usage_stats.read_bytes)', width:150, name:"MIN (Read MB)", groupable:false}},

            {select:"disk_usage_stats.write_bytes", display:{id:'disk_usage_stats.write_bytes', field:'disk_usage_stats.write_bytes', width:150, name:"Read MB", groupable:false}},
            {select:"SUM(disk_usage_stats.write_bytes)", display:{id:'SUM(disk_usage_stats.write_bytes)', field:'SUM(disk_usage_stats.write_bytes)', width:150, name:"SUM (Write MB)", groupable:false}},
            {select:"MAX(disk_usage_stats.write_bytes)", display:{id:'MAX(disk_usage_stats.write_bytes)', field:'MAX(disk_usage_stats.write_bytes)', width:150, name:"MAX (Write MB)", groupable:false}},
            {select:"MIN(disk_usage_stats.write_bytes)", display:{id:'MIN(disk_usage_stats.write_bytes)', field:'MIN(disk_usage_stats.write_bytes)', width:150, name:"MIN (Write MB)", groupable:false}},
        ],
        "StatTable.ServerMonitoringSummary.network_info_stats" : [
            {select:"COUNT(network_info_stats)", display:{id:'COUNT(network_info_stats)', field:'COUNT(network_info_stats)', width:170, name:"Count (Network Info)", groupable:false}},
            {select:"network_info_stats.interface_name", display:{id:'network_info_stats.interface_name', field:'network_info_stats.interface_name', width:150, name:"Interface Name", groupable:false}},

            {select:"network_info.tx_bytes", display:{id:'network_info.tx_bytes', field:'network_info.tx_bytes', width:150, name:"Tx Bytes", groupable:false}},
            {select:"SUM(network_info.tx_bytes)", display:{id:'SUM(network_info.tx_bytes)', field:'SUM(network_info.tx_bytes)', width:150, name:"SUM (Tx Bytes)", groupable:false}},
            {select:"MIN(network_info.tx_bytes)", display:{id:'MIN(network_info.tx_bytes)', field:'MIN(network_info.tx_bytes)', width:150, name:"MIN (Tx Bytes)", groupable:false}},
            {select:"MAX(network_info.tx_bytes)", display:{id:'MAX(network_info.tx_bytes)', field:'MAX(network_info.tx_bytes)', width:150, name:"MAX (Tx Bytes)", groupable:false}},

            {select:"network_info.tx_packets", display:{id:'network_info.tx_packets', field:'network_info.tx_packets', width:150, name:"Tx Bytes", groupable:false}},
            {select:"SUM(network_info.tx_packets)", display:{id:'SUM(network_info.tx_packets)', field:'SUM(network_info.tx_packets)', width:150, name:"SUM (Tx Packets)", groupable:false}},
            {select:"MIN(network_info.tx_packets)", display:{id:'MIN(network_info.tx_packets)', field:'MIN(network_info.tx_packets)', width:150, name:"MIN (Tx Packets)", groupable:false}},
            {select:"MAX(network_info.tx_packets)", display:{id:'MAX(network_info.tx_packets)', field:'MAX(network_info.tx_packets)', width:150, name:"MAX (Tx Packets)", groupable:false}},

            {select:"network_info.rx_bytes", display:{id:'network_info.rx_bytes', field:'network_info.rx_bytes', width:150, name:"Tx Bytes", groupable:false}},
            {select:"SUM(network_info.rx_bytes)", display:{id:'SUM(network_info.rx_bytes)', field:'SUM(network_info.rx_bytes)', width:150, name:"SUM (Rx Bytes)", groupable:false}},
            {select:"MIN(network_info.rx_bytes)", display:{id:'MIN(network_info.rx_bytes)', field:'MIN(network_info.rx_bytes)', width:150, name:"MIN (Rx Bytes)", groupable:false}},
            {select:"MAX(network_info.rx_bytes)", display:{id:'MAX(network_info.rx_bytes)', field:'MAX(network_info.rx_bytes)', width:150, name:"MAX (Rx Bytes)", groupable:false}},

            {select:"network_info.rx_packets", display:{id:'network_info.rx_packets', field:'network_info.rx_packets', width:150, name:"Tx Bytes", groupable:false}},
            {select:"SUM(network_info.rx_packets)", display:{id:'SUM(network_info.rx_packets)', field:'SUM(network_info.rx_packets)', width:150, name:"SUM (Rx Packets)", groupable:false}},
            {select:"MIN(network_info.rx_packets)", display:{id:'MIN(network_info.rx_packets)', field:'MIN(network_info.rx_packets)', width:150, name:"MIN (Rx Packets)", groupable:false}},
            {select:"MAX(network_info.rx_packets)", display:{id:'MAX(network_info.rx_packets)', field:'MAX(network_info.rx_packets)', width:150, name:"MAX (Rx Packets)", groupable:false}},
        ],
        "StatTable.ServerMonitoringSummary.resource_info_stats" : [
            {select:"COUNT(resource_info_stats)", display:{id:'COUNT(resource_info_stats)', field:'COUNT(resource_info_stats)', width:150, name:"Count (Resource Info)", groupable:false}},

            {select:"resource_info_stats.cpu_usage_percentage", display:{id:'resource_info_stats.cpu_usage_percentage', field:'resource_info_stats.cpu_usage_percentage', width:150, name:"Tx Bytes", groupable:false}},
            {select:"SUM(resource_info_stats.cpu_usage_percentage)", display:{id:'SUM(resource_info_stats.cpu_usage_percentage)', field:'SUM(resource_info_stats.cpu_usage_percentage)', width:150, name:"SUM (CPU Usage %)", groupable:false}},
            {select:"MIN(resource_info_stats.cpu_usage_percentage)", display:{id:'MIN(resource_info_stats.cpu_usage_percentage)', field:'MIN(resource_info_stats.cpu_usage_percentage)', width:150, name:"MIN (CPU Usage %)", groupable:false}},
            {select:"MAX(resource_info_stats.cpu_usage_percentage)", display:{id:'MAX(resource_info_stats.cpu_usage_percentage)', field:'MAX(resource_info_stats.cpu_usage_percentage)', width:150, name:"MAX (CPU Usage %)", groupable:false}},

            {select:"resource_info_stats.mem_usage_mb", display:{id:'resource_info_stats.mem_usage_mb', field:'resource_info_stats.mem_usage_mb', width:170, name:"Mem Usage Mb", groupable:false}},
            {select:"SUM(resource_info_stats.mem_usage_mb)", display:{id:'SUM(resource_info_stats.mem_usage_mb)', field:'SUM(resource_info_stats.mem_usage_mb)', width:170, name:"SUM (Mem Usage Mb)", groupable:false}},
            {select:"MIN(resource_info_stats.mem_usage_mb)", display:{id:'MIN(resource_info_stats.mem_usage_mb)', field:'MIN(resource_info_stats.mem_usage_mb)', width:170, name:"MIN (Mem Usage Mb)", groupable:false}},
            {select:"MAX(resource_info_stats.mem_usage_mb)", display:{id:'MAX(resource_info_stats.mem_usage_mb)', field:'MAX(resource_info_stats.mem_usage_mb)', width:170, name:"MAX (Mem Usage Mb)", groupable:false}},

            {select:"resource_info_stats.mem_usage_percent", display:{id:'resource_info_stats.mem_usage_percent', field:'resource_info_stats.mem_usage_percent', width:150, name:"Mem Usage %", groupable:false}},
            {select:"SUM(resource_info_stats.mem_usage_percent)", display:{id:'SUM(resource_info_stats.mem_usage_percent)', field:'SUM(resource_info_stats.mem_usage_percent)', width:150, name:"SUM (Mem Usage %)", groupable:false}},
            {select:"MIN(resource_info_stats.mem_usage_percent)", display:{id:'MIN(resource_info_stats.mem_usage_percent)', field:'MIN(resource_info_stats.mem_usage_percent)', width:150, name:"MIN (Mem Usage %)", groupable:false}},
            {select:"MAX(resource_info_stats.mem_usage_percent)", display:{id:'MAX(resource_info_stats.mem_usage_percent)', field:'MAX(resource_info_stats.mem_usage_percent)', width:150, name:"MAX (Mem Usage %)", groupable:false}},
        ],
        "StatTable.ServerMonitoringInfo.file_system_view_stats.physical_disks" : [
            {select:"COUNT(file_system_view_stats.physical_disks)", display:{id:'COUNT(file_system_view_stats.physical_disks)', field:'COUNT(file_system_view_stats.physical_disks)', width:150, name:"Count (Physical Disks)", groupable:false}},
            {select:"file_system_view_stats.fs_name", display:{id:'file_system_view_stats.fs_name', field:'file_system_view_stats.fs_name', width:150, name:"Fs Name", groupable:false}},
            {select:"file_system_view_stats.mountpoint", display:{id:'file_system_view_stats.mountpoint', field:'file_system_view_stats.mountpoint', width:150, name:"Mount Point", groupable:false}},
            {select:"file_system_view_stats.type", display:{id:'file_system_view_stats.type', field:'file_system_view_stats.type', width:150, name:"Type", groupable:false}},

            {select:"file_system_view_stats.size_kb", display:{id:'file_system_view_stats.size_kb', field:'file_system_view_stats.size_kb', width:150, name:"Fs Size Kb", groupable:false}},
            {select:"SUM(file_system_view_stats.size_kb)", display:{id:'SUM(file_system_view_stats.size_kb)', field:'SUM(file_system_view_stats.size_kb)', width:150, name:"SUM (Fs Size Kb)", groupable:false}},
            {select:"MIN(file_system_view_stats.size_kb)", display:{id:'MIN(file_system_view_stats.size_kb)', field:'MIN(file_system_view_stats.size_kb)', width:150, name:"MIN (Fs Size Kb)", groupable:false}},
            {select:"MAX(file_system_view_stats.size_kb)", display:{id:'MAX(file_system_view_stats.size_kb)', field:'MAX(file_system_view_stats.size_kb)', width:150, name:"MAX (Fs Size Kb)", groupable:false}},

            {select:"file_system_view_stats.used_kb", display:{id:'file_system_view_stats.used_kb', field:'file_system_view_stats.used_kb', width:150, name:"Fs Used Kb", groupable:false}},
            {select:"SUM(file_system_view_stats.used_kb)", display:{id:'SUM(file_system_view_stats.used_kb)', field:'SUM(file_system_view_stats.used_kb)', width:150, name:"SUM (Fs Used Kb)", groupable:false}},
            {select:"MIN(file_system_view_stats.used_kb)", display:{id:'MIN(file_system_view_stats.used_kb)', field:'MIN(file_system_view_stats.used_kb)', width:150, name:"MIN (Fs Used Kb)", groupable:false}},
            {select:"MAX(file_system_view_stats.used_kb)", display:{id:'MAX(file_system_view_stats.used_kb)', field:'MAX(file_system_view_stats.used_kb)', width:150, name:"MAX (Fs Used Kb)", groupable:false}},

            {select:"file_system_view_stats.available_kb", display:{id:'file_system_view_stats.available_kb', field:'file_system_view_stats.available_kb', width:150, name:"Fs Available Kb", groupable:false}},
            {select:"SUM(file_system_view_stats.available_kb)", display:{id:'SUM(file_system_view_stats.available_kb)', field:'SUM(file_system_view_stats.available_kb)', width:150, name:"SUM (Fs Available Kb)", groupable:false}},
            {select:"MIN(file_system_view_stats.available_kb)", display:{id:'MIN(file_system_view_stats.available_kb)', field:'MIN(file_system_view_stats.available_kb)', width:150, name:"MIN (Fs Available Kb)", groupable:false}},
            {select:"MAX(file_system_view_stats.available_kb)", display:{id:'MAX(file_system_view_stats.available_kb)', field:'MAX(file_system_view_stats.available_kb)', width:150, name:"MAX (Fs Available Kb)", groupable:false}},

            {select:"file_system_view_stats.used_percentage", display:{id:'file_system_view_stats.used_percentage', field:'file_system_view_stats.used_percentage', width:150, name:"Fs Used %", groupable:false}},
            {select:"SUM(file_system_view_stats.used_percentage)", display:{id:'SUM(file_system_view_stats.used_percentage)', field:'SUM(file_system_view_stats.used_percentage)', width:150, name:"SUM (Fs Used %)", groupable:false}},
            {select:"MIN(file_system_view_stats.used_percentage)", display:{id:'MIN(file_system_view_stats.used_percentage)', field:'MIN(file_system_view_stats.used_percentage)', width:150, name:"MIN (Fs Used %)", groupable:false}},
            {select:"MAX(file_system_view_stats.used_percentage)", display:{id:'MAX(file_system_view_stats.used_percentage)', field:'MAX(file_system_view_stats.used_percentage)', width:150, name:"MAX (Fs Used %)", groupable:false}},


            {select:"file_system_view_stats.physical_disks.disk_name", display:{id:'file_system_view_stats.physical_disks.disk_name', field:'file_system_view_stats.physical_disks.disk_name', width:150, name:"Physical Disk Name", groupable:false}},

            {select:"file_system_view_stats.physical_disks.disk_size_kb", display:{id:'file_system_view_stats.physical_disks.disk_size_kb', field:'file_system_view_stats.physical_disks.disk_size_kb', width:190, name:"Physical Size Kb", groupable:false}},
            {select:"SUM(file_system_view_stats.physical_disks.disk_size_kb)", display:{id:'SUM(file_system_view_stats.physical_disks.disk_size_kb)', field:'SUM(file_system_view_stats.physical_disks.disk_size_kb)', width:190, name:"SUM (Physical Size Kb)", groupable:false}},
            {select:"MIN(file_system_view_stats.physical_disks.disk_size_kb)", display:{id:'MIN(file_system_view_stats.physical_disks.disk_size_kb)', field:'MIN(file_system_view_stats.physical_disks.disk_size_kb)', width:190, name:"MIN (Physical Size Kb)", groupable:false}},
            {select:"MAX(file_system_view_stats.physical_disks.disk_size_kb)", display:{id:'MAX(file_system_view_stats.physical_disks.disk_size_kb)', field:'MAX(file_system_view_stats.physical_disks.disk_size_kb)', width:190, name:"MAX (Physical Size Kb)", groupable:false}},

            {select:"file_system_view_stats.physical_disks.disk_used_kb", display:{id:'file_system_view_stats.physical_disks.disk_used_kb', field:'file_system_view_stats.physical_disks.disk_used_kb', width:190, name:"Physical Disk Used Kb", groupable:false}},
            {select:"SUM(file_system_view_stats.physical_disks.disk_used_kb)", display:{id:'SUM(file_system_view_stats.physical_disks.disk_used_kb)', field:'SUM(file_system_view_stats.physical_disks.disk_used_kb)', width:190, name:"SUM (Physical Disk Used Kb)", groupable:false}},
            {select:"MIN(file_system_view_stats.physical_disks.disk_used_kb)", display:{id:'MIN(file_system_view_stats.physical_disks.disk_used_kb)', field:'MIN(file_system_view_stats.physical_disks.disk_used_kb)', width:190, name:"MIN (Physical Disk Used Kb)", groupable:false}},
            {select:"MAX(file_system_view_stats.physical_disks.disk_used_kb)", display:{id:'MAX(file_system_view_stats.physical_disks.disk_used_kb)', field:'MAX(file_system_view_stats.physical_disks.disk_used_kb)', width:190, name:"MAX (Physical Disk Used Kb)", groupable:false}},

            {select:"file_system_view_stats.physical_disks.disk_available_kb", display:{id:'file_system_view_stats.physical_disks.disk_available_kb', field:'file_system_view_stats.physical_disks.disk_available_kb', width:220, name:"Physical Disk Available Kb", groupable:false}},
            {select:"SUM(file_system_view_stats.physical_disks.disk_available_kb)", display:{id:'SUM(file_system_view_stats.physical_disks.disk_available_kb)', field:'SUM(file_system_view_stats.physical_disks.disk_available_kb)', width:220, name:"SUM (Physical Disk Available Kb)", groupable:false}},
            {select:"MIN(file_system_view_stats.physical_disks.disk_available_kb)", display:{id:'MIN(file_system_view_stats.physical_disks.disk_available_kb)', field:'MIN(file_system_view_stats.physical_disks.disk_available_kb)', width:220, name:"MIN (Physical Disk Available Kb)", groupable:false}},
            {select:"MAX(file_system_view_stats.physical_disks.disk_available_kb)", display:{id:'MAX(file_system_view_stats.physical_disks.disk_available_kb)', field:'MAX(file_system_view_stats.physical_disks.disk_available_kb)', width:220, name:"MAX (Physical Disk Available Kb)", groupable:false}},

            {select:"file_system_view_stats.physical_disks.disk_used_percentage", display:{id:'file_system_view_stats.physical_disks.disk_used_percentage', field:'file_system_view_stats.physical_disks.disk_used_percentage', width:190, name:"Physical Disk Used %", groupable:false}},
            {select:"SUM(file_system_view_stats.physical_disks.disk_used_percentage)", display:{id:'SUM(file_system_view_stats.physical_disks.disk_used_percentage)', field:'SUM(file_system_view_stats.physical_disks.disk_used_percentage)', width:190, name:"SUM (Physical Disk Used %)", groupable:false}},
            {select:"MIN(file_system_view_stats.physical_disks.disk_used_percentage)", display:{id:'MIN(file_system_view_stats.physical_disks.disk_used_percentage)', field:'MIN(file_system_view_stats.physical_disks.disk_used_percentage)', width:190, name:"MIN (Physical Disk Used %)", groupable:false}},
            {select:"MAX(file_system_view_stats.physical_disks.disk_used_percentage)", display:{id:'MAX(file_system_view_stats.physical_disks.disk_used_percentage)', field:'MAX(file_system_view_stats.physical_disks.disk_used_percentage)', width:190, name:"MAX (Physical Disk Used %)", groupable:false}},
        ],

        "StatTable.SandeshMessageStat.msg_info" : [
            {select:"COUNT(msg_info)", display:{id:'COUNT(msg_info)', field:'COUNT(msg_info)', width:150, name:"Count (Msg Info)", groupable:false}},
            {select:"msg_info.type", display:{id:'msg_info.type', field:'msg_info.type', width:210, name:"Message Type", groupable:false}},
            {select:"msg_info.level", display:{id:'msg_info.level', field:'msg_info.level', width:150, name:"Message Level", groupable:false}},

            {select:"msg_info.messages", display:{id:'msg_info.messages', field:'msg_info.messages', width:150, name:"Messages", groupable:false}},
            {select:"SUM(msg_info.messages)", display:{id:'SUM(msg_info.messages)', field:'SUM(msg_info.messages)', width:150, name:"SUM (Messages)", groupable:false}},
            {select:"MIN(msg_info.messages)", display:{id:'MIN(msg_info.messages)', field:'MIN(msg_info.messages)', width:150, name:"MIN (Messages)", groupable:false}},
            {select:"MAX(msg_info.messages)", display:{id:'MAX(msg_info.messages)', field:'MAX(msg_info.messages)', width:150, name:"MAX (Messages)", groupable:false}},

            {select:"msg_info.bytes", display:{id:'msg_info.bytes', field:'msg_info.messages', width:150, name:"Bytes", groupable:false}},
            {select:"SUM(msg_info.bytes)", display:{id:'SUM(msg_info.bytes)', field:'SUM(msg_info.bytes)', width:150, name:"SUM (Bytes)", groupable:false}},
            {select:"MIN(msg_info.bytes)", display:{id:'MIN(msg_info.bytes)', field:'MIN(msg_info.bytes)', width:150, name:"MIN (Bytes)", groupable:false}},
            {select:"MAX(msg_info.bytes)", display:{id:'MAX(msg_info.bytes)', field:'MAX(msg_info.bytes)', width:150, name:"MAX (Bytes)", groupable:false}}

        ],
        "StatTable.GeneratorDbStats.table_info" : [
            {select:"COUNT(table_info)", display:{id:'COUNT(table_info)', field:'COUNT(table_info)', width:150, name:"Count (Table Info)", groupable:false}},
            {select:"table_info.table_name", display:{id:'table_info.table_name', field:'table_info.table_name', width:150, name:"Table Name", groupable:false}},

            {select:"table_info.reads", display:{id:'table_info.reads', field:'table_info.reads', width:150, name:"Reads", groupable:false}},
            {select:"SUM(table_info.reads)", display:{id:'SUM(table_info.reads)', field:'SUM(table_info.reads)', width:150, name:"SUM (Reads)", groupable:false}},
            {select:"MIN(table_info.reads)", display:{id:'MIN(table_info.reads)', field:'MIN(table_info.reads)', width:150, name:"MIN (Reads)", groupable:false}},
            {select:"MAX(table_info.reads)", display:{id:'MAX(table_info.reads)', field:'MAX(table_info.reads)', width:150, name:"MAX (Reads)", groupable:false}},

            {select:"table_info.read_fails", display:{id:'table_info.read_fails', field:'table_info.read_fails', width:150, name:"Read Fails", groupable:false}},
            {select:"SUM(table_info.read_fails)", display:{id:'SUM(table_info.read_fails)', field:'SUM(table_info.read_fails)', width:150, name:"SUM (Read Fails)", groupable:false}},
            {select:"MIN(table_info.read_fails)", display:{id:'MIN(table_info.read_fails)', field:'MIN(table_info.read_fails)', width:150, name:"MIN (Read Fails)", groupable:false}},
            {select:"MAX(table_info.read_fails)", display:{id:'MAX(table_info.read_fails)', field:'MAX(table_info.read_fails)', width:150, name:"MAX (Read Fails)", groupable:false}},

            {select:"table_info.writes", display:{id:'table_info.writes', field:'table_info.writes', width:150, name:"Writes", groupable:false}},
            {select:"SUM(table_info.writes)", display:{id:'SUM(table_info.writes)', field:'SUM(table_info.writes)', width:150, name:"SUM (Writes)", groupable:false}},
            {select:"MIN(table_info.writes)", display:{id:'MIN(table_info.writes)', field:'MIN(table_info.writes)', width:150, name:"MIN (Writes)", groupable:false}},
            {select:"MAX(table_info.writes)", display:{id:'MAX(table_info.writes)', field:'MAX(table_info.writes)', width:150, name:"MAX (Writes)", groupable:false}},

            {select:"table_info.write_fails", display:{id:'table_info.write_fails', field:'table_info.write_fails', width:150, name:"Write Fails", groupable:false}},
            {select:"SUM(table_info.write_fails)", display:{id:'SUM(table_info.write_fails)', field:'SUM(table_info.write_fails)', width:150, name:"SUM (Write Fails)", groupable:false}},
            {select:"MIN(table_info.write_fails)", display:{id:'MIN(table_info.write_fails)', field:'MIN(table_info.write_fails)', width:150, name:"MIN (Write Fails)", groupable:false}},
            {select:"MAX(table_info.write_fails)", display:{id:'MAX(table_info.write_fails)', field:'MAX(table_info.write_fails)', width:150, name:"MAX (Write Fails)", groupable:false}}
        ],
        "StatTable.GeneratorDbStats.statistics_table_info" : [
            {select:"COUNT(statistics_table_info)", display:{id:'COUNT(statistics_table_info)', field:'COUNT(statistics_table_info)', width:150, name:"Count (Table Info)", groupable:false}},
            {select:"statistics_table_info.table_name", display:{id:'statistics_table_info.table_name', field:'statistics_table_info.table_name', width:250, name:"Table Name", groupable:false}},

            {select:"statistics_table_info.reads", display:{id:'statistics_table_info.reads', field:'statistics_table_info.reads', width:150, name:"Reads", groupable:false}},
            {select:"SUM(statistics_table_info.reads)", display:{id:'SUM(statistics_table_info.reads)', field:'SUM(statistics_table_info.reads)', width:150, name:"SUM (Reads)", groupable:false}},
            {select:"MIN(statistics_table_info.reads)", display:{id:'MIN(statistics_table_info.reads)', field:'MIN(statistics_table_info.reads)', width:150, name:"MIN (Reads)", groupable:false}},
            {select:"MAX(statistics_table_info.reads)", display:{id:'MAX(statistics_table_info.reads)', field:'MAX(statistics_table_info.reads)', width:150, name:"MAX (Reads)", groupable:false}},

            {select:"statistics_table_info.read_fails", display:{id:'statistics_table_info.read_fails', field:'statistics_table_info.read_fails', width:150, name:"Read Fails", groupable:false}},
            {select:"SUM(statistics_table_info.read_fails)", display:{id:'SUM(statistics_table_info.read_fails)', field:'SUM(statistics_table_info.read_fails)', width:150, name:"SUM (Read Fails)", groupable:false}},
            {select:"MIN(statistics_table_info.read_fails)", display:{id:'MIN(statistics_table_info.read_fails)', field:'MIN(statistics_table_info.read_fails)', width:150, name:"MIN (Read Fails)", groupable:false}},
            {select:"MAX(statistics_table_info.read_fails)", display:{id:'MAX(statistics_table_info.read_fails)', field:'MAX(statistics_table_info.read_fails)', width:150, name:"MAX (Read Fails)", groupable:false}},

            {select:"statistics_table_info.writes", display:{id:'statistics_table_info.writes', field:'statistics_table_info.writes', width:150, name:"Writes", groupable:false}},
            {select:"SUM(statistics_table_info.writes)", display:{id:'SUM(statistics_table_info.writes)', field:'SUM(statistics_table_info.writes)', width:150, name:"SUM (Writes)", groupable:false}},
            {select:"MIN(statistics_table_info.writes)", display:{id:'MIN(statistics_table_info.writes)', field:'MIN(statistics_table_info.writes)', width:150, name:"MIN (Writes)", groupable:false}},
            {select:"MAX(statistics_table_info.writes)", display:{id:'MAX(statistics_table_info.writes)', field:'MAX(statistics_table_info.writes)', width:150, name:"MAX (Writes)", groupable:false}},

            {select:"statistics_table_info.write_fails", display:{id:'statistics_table_info.write_fails', field:'statistics_table_info.write_fails', width:150, name:"Write Fails", groupable:false}},
            {select:"SUM(statistics_table_info.write_fails)", display:{id:'SUM(statistics_table_info.write_fails)', field:'SUM(statistics_table_info.write_fails)', width:150, name:"SUM (Write Fails)", groupable:false}},
            {select:"MIN(statistics_table_info.write_fails)", display:{id:'MIN(statistics_table_info.write_fails)', field:'MIN(statistics_table_info.write_fails)', width:150, name:"MIN (Write Fails)", groupable:false}},
            {select:"MAX(statistics_table_info.write_fails)", display:{id:'MAX(statistics_table_info.write_fails)', field:'MAX(statistics_table_info.write_fails)', width:150, name:"MAX (Write Fails)", groupable:false}}
        ],
        "StatTable.GeneratorDbStats.errors" : [
            {select:"COUNT(errors)", display:{id:'COUNT(errors)', field:'COUNT(errors)', width:150, name:"Count (Errors)", groupable:false}},

            {select:"errors.write_tablespace_fails", display:{id:'errors.write_tablespace_fails', field:'errors.write_tablespace_fails', width:180, name:"Write Tablespace Fails", groupable:false}},
            {select:"SUM(errors.write_tablespace_fails)", display:{id:'SUM(errors.write_tablespace_fails)', field:'SUM(errors.write_tablespace_fails)', width:200, name:"SUM (Write Tablespace Fails)", groupable:false}},
            {select:"MIN(errors.write_tablespace_fails)", display:{id:'MIN(errors.write_tablespace_fails)', field:'MIN(errors.write_tablespace_fails)', width:200, name:"MIN (Write Tablespace Fails)", groupable:false}},
            {select:"MAX(errors.write_tablespace_fails)", display:{id:'MAX(errors.write_tablespace_fails)', field:'MAX(errors.write_tablespace_fails)', width:200, name:"MAX (Write Tablespace Fails)", groupable:false}},

            {select:"errors.read_tablespace_fails", display:{id:'errors.read_tablespace_fails', field:'errors.read_tablespace_fails', width:200, name:"Read Tablespace Fails", groupable:false}},
            {select:"SUM(errors.read_tablespace_fails)", display:{id:'SUM(errors.read_tablespace_fails)', field:'SUM(errors.read_tablespace_fails)', width:200, name:"SUM (Read Tablespace Fails)", groupable:false}},
            {select:"MIN(errors.read_tablespace_fails)", display:{id:'MIN(errors.read_tablespace_fails)', field:'MIN(errors.read_tablespace_fails)', width:200, name:"MIN (Read Tablespace Fails)", groupable:false}},
            {select:"MAX(errors.read_tablespace_fails)", display:{id:'MAX(errors.read_tablespace_fails)', field:'MAX(errors.read_tablespace_fails)', width:200, name:"MAX (Read Tablespace Fails)", groupable:false}},

            {select:"errors.write_table_fails", display:{id:'errors.write_table_fails', field:'errors.write_table_fails', width:180, name:"Write Table Fails", groupable:false}},
            {select:"SUM(errors.write_table_fails)", display:{id:'SUM(errors.write_table_fails)', field:'SUM(errors.write_table_fails)', width:160, name:"SUM (Write Table Fails)", groupable:false}},
            {select:"MIN(errors.write_table_fails)", display:{id:'MIN(errors.write_table_fails)', field:'MIN(errors.write_table_fails)', width:160, name:"MIN (Write Table Fails)", groupable:false}},
            {select:"MAX(errors.write_table_fails)", display:{id:'MAX(errors.write_table_fails)', field:'MAX(errors.write_table_fails)', width:160, name:"MAX (Write Table Fails)", groupable:false}},

            {select:"errors.read_table_fails", display:{id:'errors.read_table_fails', field:'errors.read_table_fails', width:160, name:"Read Table Fails", groupable:false}},
            {select:"SUM(errors.read_table_fails)", display:{id:'SUM(errors.read_table_fails)', field:'SUM(errors.read_table_fails)', width:160, name:"SUM (Read Table Fails)", groupable:false}},
            {select:"MIN(errors.read_table_fails)", display:{id:'MIN(errors.read_table_fails)', field:'MIN(errors.read_table_fails)', width:160, name:"MIN (Read Table Fails)", groupable:false}},
            {select:"MAX(errors.read_table_fails)", display:{id:'MAX(errors.read_table_fails)', field:'MAX(errors.read_table_fails)', width:160, name:"MAX (Read Table Fails)", groupable:false}},

            {select:"errors.write_column_fails", display:{id:'errors.write_column_fails', field:'errors.write_column_fails', width:180, name:"Write Column Fails", groupable:false}},
            {select:"SUM(errors.write_column_fails)", display:{id:'SUM(errors.write_column_fails)', field:'SUM(errors.write_column_fails)', width:180, name:"SUM (Write Column Fails)", groupable:false}},
            {select:"MIN(errors.write_column_fails)", display:{id:'MIN(errors.write_column_fails)', field:'MIN(errors.write_column_fails)', width:180, name:"MIN (Write Column Fails)", groupable:false}},
            {select:"MAX(errors.write_column_fails)", display:{id:'MAX(errors.write_column_fails)', field:'MAX(errors.write_column_fails)', width:180, name:"MAX (Write Column Fails)", groupable:false}},

            {select:"errors.write_batch_column_fails", display:{id:'errors.write_batch_column_fails', field:'errors.write_batch_column_fails', width:220, name:"Write Column Batch Fails", groupable:false}},
            {select:"SUM(errors.write_batch_column_fails)", display:{id:'SUM(errors.write_batch_column_fails)', field:'SUM(errors.write_batch_column_fails)', width:220, name:"SUM (Write Column Batch Fails)", groupable:false}},
            {select:"MIN(errors.write_batch_column_fails)", display:{id:'MIN(errors.write_batch_column_fails)', field:'MIN(errors.write_batch_column_fails)', width:220, name:"MIN (Write Column Batch Fails)", groupable:false}},
            {select:"MAX(errors.write_batch_column_fails)", display:{id:'MAX(errors.write_batch_column_fails)', field:'MAX(errors.write_batch_column_fails)', width:220, name:"MAX (Write Column Batch Fails)", groupable:false}},

            {select:"errors.read_column_fails", display:{id:'errors.read_column_fails', field:'errors.read_column_fails', width:180, name:"Read Column Fails", groupable:false}},
            {select:"SUM(errors.read_column_fails)", display:{id:'SUM(errors.read_column_fails)', field:'SUM(errors.read_column_fails)', width:180, name:"SUM (Read Column Fails)", groupable:false}},
            {select:"MIN(errors.read_column_fails)", display:{id:'MIN(errors.read_column_fails)', field:'MIN(errors.read_column_fails)', width:180, name:"MIN (Read Column Fails)", groupable:false}},
            {select:"MAX(errors.read_column_fails)", display:{id:'MAX(errors.read_column_fails)', field:'MAX(errors.read_column_fails)', width:180, name:"MAX (Read Column Fails)", groupable:false}}
        ],
        "StatTable.FieldNames.fields" : [
            {select:"COUNT(fields)", display:{id:'COUNT(fields)', field:'COUNT(fields)', width:150, name:"Count (Field String)", groupable:false}},
            {select:"fields.value", display:{id:'fields.value', field:'fields.value', width:500, name:"Value", groupable:false}}
        ],
        "StatTable.FieldNames.fieldi" : [
            {select:"COUNT(fieldi)", display:{id:'COUNT(fieldi)', field:'COUNT(fieldi)', width:150, name:"Count (Field Integer)", groupable:false}},
            {select:"fieldi.value", display:{id:'fieldi.value', field:'fieldi.value', width:150, name:"Value", groupable:false}},
            {select:"SUM(fieldi.value)", display:{id:'SUM(fieldi.value)', field:'SUM(fieldi.value)', width:150, name:"SUM (Value)", groupable:false}},
            {select:"MIN(fieldi.value)", display:{id:'MIN(fieldi.value)', field:'MIN(fieldi.value)', width:150, name:"MIN (Value)", groupable:false}},
            {select:"MAX(fieldi.value)", display:{id:'MAX(fieldi.value)', field:'MAX(fieldi.value)', width:150, name:"MAX (Value)", groupable:false}}
        ],
        "StatTable.QueryPerfInfo.query_stats" : [
            {select:"COUNT(query_stats)", display:{id:'COUNT(query_stats)', field:'COUNT(query_stats)', width:150, name:"Count (Query Stats)", groupable:false}},
            {select:"table", display:{id:'table', field:'table', width:150, name:"Table", groupable:false}},

            {select:"query_stats.time", display:{id:'query_stats.time', field:'query_stats.time', width:150, name:"Query Time", groupable:false}},
            {select:"SUM(query_stats.time)", display:{id:'SUM(query_stats.time)', field:'SUM(query_stats.time)', width:150, name:"SUM (Time Taken)", groupable:false}},
            {select:"MIN(query_stats.time)", display:{id:'MIN(query_stats.time)', field:'MIN(query_stats.time)', width:150, name:"MIN (Time Taken)", groupable:false}},
            {select:"MAX(query_stats.time)", display:{id:'MAX(query_stats.time)', field:'MAX(query_stats.time)', width:150, name:"MAX (Time Taken)", groupable:false}},

            {select:"query_stats.rows", display:{id:'query_stats.rows', field:'query_stats.rows', width:120, name:"Rows Returned", groupable:false}},
            {select:"SUM(query_stats.rows)", display:{id:'SUM(query_stats.rows)', field:'SUM(query_stats.rows)', width:150, name:"SUM (Rows Returned)", groupable:false}},
            {select:"MIN(query_stats.rows)", display:{id:'MIN(query_stats.rows)', field:'MIN(query_stats.rows)', width:150, name:"MIN (Rows Returned)", groupable:false}},
            {select:"MAX(query_stats.rows)", display:{id:'MAX(query_stats.rows)', field:'MAX(query_stats.rows)', width:150, name:"MAX (Rows Returned)", groupable:false}},

            {select:"query_stats.qid", display:{id:'query_stats.qid', field:'query_stats.qid', width:280, name:"Query Id", groupable:false}},
            {select:"query_stats.where", display:{id:'query_stats.where', field:'query_stats.where', width:300, name:"Where", groupable:false}},
            {select:"query_stats.select", display:{id:'query_stats.select', field:'query_stats.select', width:300, name:"Select", groupable:false}},
            {select:"query_stats.post", display:{id:'query_stats.post', field:'query_stats.post', width:300, name:"Filter", groupable:false}},

            {select:"query_stats.time_span", display:{id:'query_stats.time_span', field:'query_stats.time_span', width:150, name:"Time Span", groupable:false}},
            {select:"SUM(query_stats.time_span)", display:{id:'SUM(query_stats.time_span)', field:'SUM(query_stats.time_span)', width:150, name:"SUM (Time Span)", groupable:false}},
            {select:"MIN(query_stats.time_span)", display:{id:'MIN(query_stats.time_span)', field:'MIN(query_stats.time_span)', width:150, name:"MIN (Time Span)", groupable:false}},
            {select:"MAX(query_stats.time_span)", display:{id:'MAX(query_stats.time_span)', field:'MAX(query_stats.time_span)', width:150, name:"MAX (Time Span)", groupable:false}},

            {select:"query_stats.chunks", display:{id:'query_stats.chunks', field:'query_stats.chunks', width:150, name:"Chunks", groupable:false}},
            {select:"SUM(query_stats.chunks)", display:{id:'SUM(query_stats.chunks)', field:'SUM(query_stats.chunks)', width:150, name:"SUM (Chunks)", groupable:false}},
            {select:"MIN(query_stats.chunks)", display:{id:'MIN(query_stats.chunks)', field:'MIN(query_stats.chunks)', width:150, name:"MIN (Chunks)", groupable:false}},
            {select:"MAX(query_stats.chunks)", display:{id:'MAX(query_stats.chunks)', field:'MAX(query_stats.chunks)', width:150, name:"MAX (Chunks)", groupable:false}},

            {select:"query_stats.chunk_where_time", display:{id:'query_stats.chunk_where_time', field:'query_stats.chunk_where_time', width:170, name:"Chunk Where Time", groupable:false}},
            {select:"query_stats.chunk_select_time", display:{id:'query_stats.chunk_select_time', field:'query_stats.chunk_select_time', width:170, name:"Chunk Select Time", groupable:false}},
            {select:"query_stats.chunk_postproc_time", display:{id:'query_stats.chunk_postproc_time', field:'query_stats.chunk_postproc_time', width:170, name:"Chunk Postproc Time", groupable:false}},
            {select:"query_stats.chunk_merge_time", display:{id:'query_stats.chunk_merge_time', field:'query_stats.chunk_merge_time', width:170, name:"Chunk Merge Time", groupable:false}},

            {select:"query_stats.final_merge_time", display:{id:'query_stats.final_merge_time', field:'query_stats.final_merge_time', width:170, name:"Final Merge Time", groupable:false}},
            {select:"SUM(query_stats.final_merge_time)", display:{id:'SUM(query_stats.final_merge_time)', field:'SUM(query_stats.final_merge_time)', width:170, name:"SUM (Final Merge Time)", groupable:false}},
            {select:"MIN(query_stats.final_merge_time)", display:{id:'MIN(query_stats.final_merge_time)', field:'MIN(query_stats.final_merge_time)', width:170, name:"MIN (Final Merge Time)", groupable:false}},
            {select:"MAX(query_stats.final_merge_time)", display:{id:'MAX(query_stats.final_merge_time)', field:'MAX(query_stats.final_merge_time)', width:170, name:"MAX (Final Merge Time)", groupable:false}},

            {select:"query_stats.enq_delay", display:{id:'query_stats.enq_delay', field:'query_stats.enq_delay', width:170, name:"Enq Delay", groupable:false}},
            {select:"SUM(query_stats.enq_delay)", display:{id:'SUM(query_stats.enq_delay)', field:'SUM(query_stats.enq_delay)', width:170, name:"SUM (Enq Delay)", groupable:false}},
            {select:"MIN(query_stats.enq_delay)", display:{id:'MIN(query_stats.enq_delay)', field:'MIN(query_stats.enq_delay)', width:170, name:"MIN (Enq Delay)", groupable:false}},
            {select:"MAX(query_stats.enq_delay)", display:{id:'MAX(query_stats.enq_delay)', field:'MAX(query_stats.enq_delay)', width:170, name:"MAX (Enq Delay)", groupable:false}},

            {select:"query_stats.error", display:{id:'query_stats.error', field:'query_stats.error', width:100, name:"Error", groupable:false}}
        ],
        "StatTable.UveVirtualNetworkAgent.vn_stats" : [
            {select:"COUNT(vn_stats)", display:{id:'COUNT(vn_stats)', field:'COUNT(vn_stats)', width:120, name:"Count (VN Stats)", groupable:false}},
            {select:"vn_stats.other_vn", display:{id:'vn_stats.other_vn', field:'vn_stats.other_vn', width:250, name:"Other VN", groupable:false}},
            {select:"vn_stats.vrouter", display:{id:'vn_stats.vrouter', field:'vn_stats.vrouter', width:120, title:"vRouter", groupable:false}},

            {select:"vn_stats.in_tpkts", display:{id:'vn_stats.in_tpkts', field:'vn_stats.in_tpkts', width:150, name:"In Packets", groupable:false}},
            {select:"SUM(vn_stats.in_tpkts)", display:{id:'SUM(vn_stats.in_tpkts)', field:'SUM(vn_stats.in_tpkts)', width:150, name:"SUM (In Packets)", groupable:false}},
            {select:"MIN(vn_stats.in_tpkts)", display:{id:'MIN(vn_stats.in_tpkts)', field:'MIN(vn_stats.in_tpkts)', width:150, name:"MIN (In Packets)", groupable:false}},
            {select:"MAX(vn_stats.in_tpkts)", display:{id:'MAX(vn_stats.in_tpkts)', field:'MAX(vn_stats.in_tpkts)', width:150, name:"MAX (In Packets)", groupable:false}},

            {select:"vn_stats.in_bytes", display:{id:'vn_stats.in_bytes', field:'vn_stats.in_bytes', width:120, name:"In Bytes", groupable:false}},
            {select:"SUM(vn_stats.in_bytes)", display:{id:'SUM(vn_stats.in_bytes)', field:'SUM(vn_stats.in_bytes)', width:120, name:"SUM (In Bytes)", groupable:false}},
            {select:"MIN(vn_stats.in_bytes)", display:{id:'MIN(vn_stats.in_bytes)', field:'MIN(vn_stats.in_bytes)', width:120, name:"MIN (In Bytes)", groupable:false}},
            {select:"MAX(vn_stats.in_bytes)", display:{id:'MAX(vn_stats.in_bytes)', field:'MAX(vn_stats.in_bytes)', width:120, name:"MAX (In Bytes)", groupable:false}},


            {select:"vn_stats.out_tpkts", display:{id:'vn_stats.out_tpkts', field:'vn_stats.out_tpkts', width:150, name:"Out Packets", groupable:false}},
            {select:"SUM(vn_stats.out_tpkts)", display:{id:'SUM(vn_stats.out_tpkts)', field:'SUM(vn_stats.out_tpkts)', width:150, name:"SUM (Out Packets)", groupable:false}},
            {select:"MIN(vn_stats.out_tpkts)", display:{id:'MIN(vn_stats.out_tpkts)', field:'MIN(vn_stats.out_tpkts)', width:150, name:"MIN (Out Packets)", groupable:false}},
            {select:"MAX(vn_stats.out_tpkts)", display:{id:'MAX(vn_stats.out_tpkts)', field:'MAX(vn_stats.out_tpkts)', width:150, name:"MAX (Out Packets)", groupable:false}},

            {select:"vn_stats.out_bytes", display:{id:'vn_stats.out_bytes', field:'vn_stats.out_bytes', width:120, name:"Out Bytes", groupable:false}},
            {select:"SUM(vn_stats.out_bytes)", display:{id:'SUM(vn_stats.out_bytes)', field:'SUM(vn_stats.out_bytes)', width:120, name:"SUM (Out Bytes)", groupable:false}},
            {select:"MIN(vn_stats.out_bytes)", display:{id:'MIN(vn_stats.out_bytes)', field:'MIN(vn_stats.out_bytes)', width:120, name:"MIN (Out Bytes)", groupable:false}},
            {select:"MAX(vn_stats.out_bytes)", display:{id:'MAX(vn_stats.out_bytes)', field:'MAX(vn_stats.out_bytes)', width:120, name:"MAX (Out Bytes)", groupable:false}}
        ],
        "StatTable.DatabasePurgeInfo.stats" : [
            {select:"COUNT(stats)", display:{id:'COUNT(stats)', field:'COUNT(stats)', width:120, name:"Count (Stats)", groupable:false}},
            {select:"stats.purge_id", display:{id:'stats.purge_id', field:'stats.purge_id', width:280, name:"Purge Id", groupable:false}},
            {select:"stats.purge_status", display:{id:'stats.purge_status', field:'stats.purge_status', width:280, name:"Purge Status", groupable:false}},
            {select:"stats.purge_status_details", display:{id:'stats.purge_status_details', field:'stats.purge_status_details', width:280, name:"Purge Status Details", groupable:false}},

            {select:"stats.request_time", display:{id:'stats.request_time', field:'stats.request_time', width:280, name:"Request Time", groupable:false}},
            {select:"SUM(stats.request_time)", display:{id:'SUM(stats.request_time)', field:'SUM(stats.request_time)', width:280, name:"SUM (Request Time)", groupable:false}},
            {select:"MIN(stats.request_time)", display:{id:'MIN(stats.request_time)', field:'MIN(stats.request_time)', width:280, name:"MIN (Request Time)", groupable:false}},
            {select:"MAX(stats.request_time)", display:{id:'MAX(stats.request_time)', field:'MAX(stats.request_time)', width:280, name:"MAX (Request Time)", groupable:false}},

            {select:"stats.rows_deleted", display:{id:'stats.rows_deleted', field:'stats.rows_deleted', width:150, name:"Rows Deleted", groupable:false}},
            {select:"SUM(stats.rows_deleted)", display:{id:'SUM(stats.rows_deleted)', field:'SUM(stats.rows_deleted)', width:150, name:"SUM (Rows Deleted)", groupable:false}},
            {select:"MIN(stats.rows_deleted)", display:{id:'MIN(stats.rows_deleted)', field:'MIN(stats.rows_deleted)', width:150, name:"MIN (Rows Deleted)", groupable:false}},
            {select:"MAX(stats.rows_deleted)", display:{id:'MAX(stats.rows_deleted)', field:'MAX(stats.rows_deleted)', width:150, name:"MAX (Rows Deleted)", groupable:false}},

            {select:"stats.duration", display:{id:'stats.duration', field:'stats.duration', width:280, name:"Time Duration", groupable:false}},
            {select:"SUM(stats.duration)", display:{id:'SUM(stats.duration)', field:'SUM(stats.duration)', width:280, name:"SUM (Time Duration)", groupable:false}},
            {select:"MIN(stats.duration)", display:{id:'MIN(stats.duration)', field:'MIN(stats.duration)', width:280, name:"MIN (Time Duration)", groupable:false}},
            {select:"MAX(stats.duration)", display:{id:'MAX(stats.duration)', field:'MAX(stats.duration)', width:280, name:"MAX (Time Duration)", groupable:false}}
        ],
        "StatTable.DatabaseUsageInfo.database_usage" : [
            {select:"COUNT(database_usage)", display:{id:'COUNT(database_usage)', field:'COUNT(database_usage)', width:170, name:"Count (DB Usage Stats)", groupable:false}},

            {select:"database_usage.disk_space_used_1k", display:{id:'database_usage.disk_space_used_1k', field:'database_usage.disk_space_used_1k', width:200, name:"Disk Space Used 1k", groupable:false}},
            {select:"SUM(database_usage.disk_space_used_1k)", display:{id:'SUM(database_usage.disk_space_used_1k)', field:'SUM(database_usage.disk_space_used_1k)', width:200, name:"SUM (Disk Space Used 1k)", groupable:false}},
            {select:"MIN(database_usage.disk_space_used_1k)", display:{id:'MIN(database_usage.disk_space_used_1k)', field:'MIN(database_usage.disk_space_used_1k)', width:200, name:"MIN (Disk Space Used 1k)", groupable:false}},
            {select:"MAX(database_usage.disk_space_used_1k)", display:{id:'MAX(database_usage.disk_space_used_1k)', field:'MAX(database_usage.disk_space_used_1k)', width:200, name:"MAX (Disk Space Used 1k)", groupable:false}},

            {select:"database_usage.disk_space_available_1k", display:{id:'database_usage.disk_space_available_1k', field:'database_usage.disk_space_available_1k', width:200, name:"Disk Space Avail 1k", groupable:false}},
            {select:"SUM(database_usage.disk_space_available_1k)", display:{id:'SUM(database_usage.disk_space_available_1k)', field:'SUM(database_usage.disk_space_available_1k)', width:200, name:"SUM (Disk Space Avail 1k)", groupable:false}},
            {select:"MIN(database_usage.disk_space_available_1k)", display:{id:'MIN(database_usage.disk_space_available_1k)', field:'MIN(database_usage.disk_space_available_1k)', width:200, name:"MIN (Disk Space Avail 1k)", groupable:false}},
            {select:"MAX(database_usage.disk_space_available_1k)", display:{id:'MAX(database_usage.disk_space_available_1k)', field:'MAX(database_usage.disk_space_available_1k)', width:200, name:"MAX (Disk Space Avail 1k)", groupable:false}},

            {select:"database_usage.analytics_db_size_1k", display:{id:'database_usage.analytics_db_size_1k', field:'database_usage.analytics_db_size_1k', width:200, name:"Analytics DB Size 1k", groupable:false}},
            {select:"SUM(database_usage.analytics_db_size_1k)", display:{id:'SUM(database_usage.analytics_db_size_1k)', field:'SUM(database_usage.analytics_db_size_1k)', width:200, name:"SUM (Analytics DB Size 1k)", groupable:false}},
            {select:"MIN(database_usage.analytics_db_size_1k)", display:{id:'MIN(database_usage.analytics_db_size_1k)', field:'MIN(database_usage.analytics_db_size_1k)', width:200, name:"MIN (Analytics DB Size 1k)", groupable:false}},
            {select:"MAX(database_usage.analytics_db_size_1k)", display:{id:'MAX(database_usage.analytics_db_size_1k)', field:'MAX(database_usage.analytics_db_size_1k)', width:200, name:"MAX (Analytics DB Size 1k)", groupable:false}}
        ],
        "StatTable.ProtobufCollectorStats.tx_socket_stats" : [
            {select:"COUNT(tx_socket_stats)", display:{id:'COUNT(tx_socket_stats)', field:'COUNT(tx_socket_stats)', width:200, name:"Count (Send Socket Stats)", groupable:false}},
            {select:"tx_socket_stats.average_blocked_duration", display:{id:'tx_socket_stats.average_blocked_duration', field:'tx_socket_stats.average_blocked_duration', width:150, name:"Avg Blocked Duration", groupable:false}},
            {select:"tx_socket_stats.blocked_duration", display:{id:'tx_socket_stats.average_blocked_duration', field:'tx_socket_stats.average_blocked_duration', width:150, name:"Blocked Duration", groupable:false}},

            {select:"tx_socket_stats.bytes", display:{id:'tx_socket_stats.bytes', field:'tx_socket_stats.bytes', width:150, name:"Bytes", groupable:false}},
            {select:"SUM(tx_socket_stats.bytes)", display:{id:'SUM(tx_socket_stats.bytes)', field:'SUM(tx_socket_stats.bytes)', width:150, name:"SUM (Bytes)", groupable:false}},
            {select:"MIN(tx_socket_stats.bytes)", display:{id:'MIN(tx_socket_stats.bytes)', field:'MIN(tx_socket_stats.bytes)', width:150, name:"MIN (Bytes)", groupable:false}},
            {select:"MAX(tx_socket_stats.bytes)", display:{id:'MAX(tx_socket_stats.bytes)', field:'MAX(tx_socket_stats.bytes)', width:150, name:"MAX (Bytes)", groupable:false}},

            {select:"tx_socket_stats.calls", display:{id:'tx_socket_stats.calls', field:'tx_socket_stats.calls', width:150, name:"Calls", groupable:false}},
            {select:"SUM(tx_socket_stats.calls)", display:{id:'SUM(tx_socket_stats.calls)', field:'SUM(tx_socket_stats.calls)', width:150, name:"SUM (Calls)", groupable:false}},
            {select:"MIN(tx_socket_stats.calls)", display:{id:'MIN(tx_socket_stats.calls)', field:'MIN(tx_socket_stats.calls)', width:150, name:"MIN (Calls)", groupable:false}},
            {select:"MAX(tx_socket_stats.calls)", display:{id:'MAX(tx_socket_stats.calls)', field:'MAX(tx_socket_stats.calls)', width:150, name:"MAX (Calls)", groupable:false}},

            {select:"tx_socket_stats.average_bytes", display:{id:'tx_socket_stats.average_bytes', field:'tx_socket_stats.average_bytes', width:180, name:"Avg Bytes", groupable:false}},
            {select:"SUM(tx_socket_stats.average_bytes)", display:{id:'SUM(tx_socket_stats.average_bytes)', field:'SUM(tx_socket_stats.average_bytes)', width:180, name:"SUM (Avg Bytes)", groupable:false}},
            {select:"MIN(tx_socket_stats.average_bytes)", display:{id:'MIN(tx_socket_stats.average_bytes)', field:'MIN(tx_socket_stats.average_bytes)', width:180, name:"MIN (Avg Bytes)", groupable:false}},
            {select:"MAX(tx_socket_stats.average_bytes)", display:{id:'MAX(tx_socket_stats.average_bytes)', field:'MAX(tx_socket_stats.average_bytes)', width:180, name:"MAX (Avg Bytes)", groupable:false}},

            {select:"tx_socket_stats.errors", display:{id:'tx_socket_stats.errors', field:'tx_socket_stats.errors', width:150, name:"Errors", groupable:false}},
            {select:"SUM(tx_socket_stats.errors)", display:{id:'SUM(tx_socket_stats.errors)', field:'SUM(tx_socket_stats.errors)', width:150, name:"SUM (Errors)", groupable:false}},
            {select:"MIN(tx_socket_stats.errors)", display:{id:'MIN(tx_socket_stats.errors)', field:'MIN(tx_socket_stats.errors)', width:150, name:"MIN (Errors)", groupable:false}},
            {select:"MAX(tx_socket_stats.errors)", display:{id:'MAX(tx_socket_stats.errors)', field:'MAX(tx_socket_stats.errors)', width:150, name:"MAX (Errors)", groupable:false}},

            {select:"tx_socket_stats.blocked_count", display:{id:'tx_socket_stats.blocked_count', field:'tx_socket_stats.blocked_count', width:180, name:"Blocked Count", groupable:false}},
            {select:"SUM(tx_socket_stats.blocked_count)", display:{id:'SUM(tx_socket_stats.blocked_count)', field:'SUM(tx_socket_stats.blocked_count)', width:180, name:"SUM (Blocked Count)", groupable:false}},
            {select:"MIN(tx_socket_stats.blocked_count)", display:{id:'MIN(tx_socket_stats.blocked_count)', field:'MIN(tx_socket_stats.blocked_count)', width:180, name:"MIN (Blocked Count)", groupable:false}},
            {select:"MAX(tx_socket_stats.blocked_count)", display:{id:'MAX(tx_socket_stats.blocked_count)', field:'MAX(tx_socket_stats.blocked_count)', width:180, name:"MAX (Blocked Count)", groupable:false}}
        ],
        "StatTable.ProtobufCollectorStats.rx_socket_stats" : [
            {select:"COUNT(rx_socket_stats)", display:{id:'COUNT(rx_socket_stats)', field:'COUNT(rx_socket_stats)', width:200, name:"Count (Receive Socket Stats)", groupable:false}},
            {select:"rx_socket_stats.blocked_duration", display:{id:'rx_socket_stats.average_blocked_duration', field:'rx_socket_stats.blocked_duration', width:180, name:"Blocked Duration", groupable:false}},
            {select:"rx_socket_stats.average_blocked_duration", display:{id:'rx_socket_stats.average_blocked_duration', field:'rx_socket_stats.average_blocked_duration', width:160, name:"Avg Blocked Duration", groupable:false}},

            {select:"rx_socket_stats.bytes", display:{id:'rx_socket_stats.bytes', field:'rx_socket_stats.bytes', width:150, name:"Bytes", groupable:false}},
            {select:"SUM(rx_socket_stats.bytes)", display:{id:'SUM(rx_socket_stats.bytes)', field:'SUM(rx_socket_stats.bytes)', width:150, name:"SUM (Bytes)", groupable:false}},
            {select:"MIN(rx_socket_stats.bytes)", display:{id:'MIN(rx_socket_stats.bytes)', field:'MIN(rx_socket_stats.bytes)', width:150, name:"MIN (Bytes)", groupable:false}},
            {select:"MAX(rx_socket_stats.bytes)", display:{id:'MAX(rx_socket_stats.bytes)', field:'MAX(rx_socket_stats.bytes)', width:150, name:"MAX (Bytes)", groupable:false}},

            {select:"rx_socket_stats.calls", display:{id:'rx_socket_stats.calls', field:'rx_socket_stats.calls', width:150, name:"Calls", groupable:false}},
            {select:"SUM(rx_socket_stats.calls)", display:{id:'SUM(rx_socket_stats.calls)', field:'SUM(rx_socket_stats.calls)', width:150, name:"SUM (Calls)", groupable:false}},
            {select:"MIN(rx_socket_stats.calls)", display:{id:'MIN(rx_socket_stats.calls)', field:'MIN(rx_socket_stats.calls)', width:150, name:"MIN (Calls)", groupable:false}},
            {select:"MAX(rx_socket_stats.calls)", display:{id:'MAX(rx_socket_stats.calls)', field:'MAX(rx_socket_stats.calls)', width:150, name:"MAX (Calls)", groupable:false}},

            {select:"rx_socket_stats.average_bytes", display:{id:'rx_socket_stats.average_bytes', field:'rx_socket_stats.average_bytes', width:180, name:"Avg Bytes", groupable:false}},
            {select:"SUM(rx_socket_stats.average_bytes)", display:{id:'SUM(rx_socket_stats.average_bytes)', field:'SUM(rx_socket_stats.average_bytes)', width:180, name:"SUM (Avg Bytes)", groupable:false}},
            {select:"MIN(rx_socket_stats.average_bytes)", display:{id:'MIN(rx_socket_stats.average_bytes)', field:'MIN(rx_socket_stats.average_bytes)', width:180, name:"MIN (Avg Bytes)", groupable:false}},
            {select:"MAX(rx_socket_stats.average_bytes)", display:{id:'MAX(rx_socket_stats.average_bytes)', field:'MAX(rx_socket_stats.average_bytes)', width:180, name:"MAX (Avg Bytes)", groupable:false}},

            {select:"rx_socket_stats.errors", display:{id:'rx_socket_stats.errors', field:'rx_socket_stats.errors', width:150, name:"Errors", groupable:false}},
            {select:"SUM(rx_socket_stats.errors)", display:{id:'SUM(rx_socket_stats.errors)', field:'SUM(rx_socket_stats.errors)', width:150, name:"SUM (Errors)", groupable:false}},
            {select:"MIN(rx_socket_stats.errors)", display:{id:'MIN(rx_socket_stats.errors)', field:'MIN(rx_socket_stats.errors)', width:150, name:"MIN (Errors)", groupable:false}},
            {select:"MAX(rx_socket_stats.errors)", display:{id:'MAX(rx_socket_stats.errors)', field:'MAX(rx_socket_stats.errors)', width:150, name:"MAX (Errors)", groupable:false}},

            {select:"rx_socket_stats.blocked_count", display:{id:'rx_socket_stats.blocked_count', field:'rx_socket_stats.blocked_count', width:180, name:"Blocked Count", groupable:false}},
            {select:"SUM(rx_socket_stats.blocked_count)", display:{id:'SUM(rx_socket_stats.blocked_count)', field:'SUM(rx_socket_stats.blocked_count)', width:180, name:"SUM (Blocked Count)", groupable:false}},
            {select:"MIN(rx_socket_stats.blocked_count)", display:{id:'MIN(rx_socket_stats.blocked_count)', field:'MIN(rx_socket_stats.blocked_count)', width:180, name:"MIN (Blocked Count)", groupable:false}},
            {select:"MAX(rx_socket_stats.blocked_count)", display:{id:'MAX(rx_socket_stats.blocked_count)', field:'MAX(rx_socket_stats.blocked_count)', width:180, name:"MAX (Blocked Count)", groupable:false}}
        ],
        "StatTable.ProtobufCollectorStats.rx_message_stats" : [
            {select:"COUNT(rx_message_stats)", display:{id:'COUNT(rx_message_stats)', field:'COUNT(rx_message_stats)', width:200, name:"Count (Receive Message Stats)", groupable:false}},
            {select:"rx_message_stats.endpoint_name", display:{id:'rx_message_stats.endpoint_name', field:'rx_message_stats.endpoint_name', width:180, name:"Endpoint Name", groupable:false}},
            {select:"rx_message_stats.message_name", display:{id:'rx_message_stats.message_name', field:'rx_message_stats.message_name', width:180, name:"Message Name", groupable:false}},

            {select:"rx_message_stats.messages", display:{id:'rx_message_stats.messages', field:'rx_message_stats.messages', width:180, name:"Messages", groupable:false}},
            {select:"SUM(rx_message_stats.messages)", display:{id:'SUM(rx_message_stats.messages)', field:'SUM(rx_message_stats.messages)', width:180, name:"SUM (Messages)", groupable:false}},
            {select:"MIN(rx_message_stats.messages)", display:{id:'MIN(rx_message_stats.messages)', field:'MIN(rx_message_stats.messages)', width:180, name:"MIN (Messages)", groupable:false}},
            {select:"MAX(rx_message_stats.messages)", display:{id:'MAX(rx_message_stats.messages)', field:'MAX(rx_message_stats.messages)', width:180, name:"MAX (Messages)", groupable:false}},

            {select:"rx_message_stats.bytes", display:{id:'rx_message_stats.bytes', field:'rx_message_stats.bytes', width:150, name:"Bytes", groupable:false}},
            {select:"SUM(rx_message_stats.bytes)", display:{id:'SUM(rx_message_stats.bytes)', field:'SUM(rx_message_stats.bytes)', width:150, name:"SUM (Bytes)", groupable:false}},
            {select:"MIN(rx_message_stats.bytes)", display:{id:'MIN(rx_message_stats.bytes)', field:'MIN(rx_message_stats.bytes)', width:150, name:"MIN (Bytes)", groupable:false}},
            {select:"MAX(rx_message_stats.bytes)", display:{id:'MAX(rx_message_stats.bytes)', field:'MAX(rx_message_stats.bytes)', width:150, name:"MAX (Bytes)", groupable:false}},

            {select:"rx_message_stats.errors", display:{id:'rx_message_stats.errors', field:'rx_message_stats.errors', width:150, name:"Errors", groupable:false}},
            {select:"SUM(rx_message_stats.errors)", display:{id:'SUM(rx_message_stats.errors)', field:'SUM(rx_message_stats.errors)', width:150, name:"SUM (Errors)", groupable:false}},
            {select:"MIN(rx_message_stats.errors)", display:{id:'MIN(rx_message_stats.errors)', field:'MIN(rx_message_stats.errors)', width:150, name:"MIN (Errors)", groupable:false}},
            {select:"MAX(rx_message_stats.errors)", display:{id:'MAX(rx_message_stats.errors)', field:'MAX(rx_message_stats.errors)', width:150, name:"MAX (Errors)", groupable:false}},

            {select:"rx_message_stats.last_timestamp", display:{id:'rx_message_stats.last_timestamp', field:'rx_message_stats.last_timestamp', width:180, name:"Last Timestamp", groupable:false}},
            {select:"SUM(rx_message_stats.last_timestamp)", display:{id:'SUM(rx_message_stats.last_timestamp)', field:'SUM(rx_message_stats.last_timestamp)', width:180, name:"SUM (Last Timestamp)", groupable:false}},
            {select:"MIN(rx_message_stats.last_timestamp)", display:{id:'MIN(rx_message_stats.last_timestamp)', field:'MIN(rx_message_stats.last_timestamp)', width:180, name:"MIN (Last Timestamp)", groupable:false}},
            {select:"MAX(rx_message_stats.last_timestamp)", display:{id:'MAX(rx_message_stats.last_timestamp)', field:'MAX(rx_message_stats.last_timestamp)', width:180, name:"MAX (Last Timestamp)", groupable:false}}
        ],

        "StatTable.ProtobufCollectorStats.db_table_info" : [
            {select:"COUNT(db_table_info)", display:{id:'COUNT(db_table_info)', field:'COUNT(db_table_info)', width:150, name:"Count (Table Info)", groupable:false}},
            {select:"db_table_info.table_name", display:{id:'db_table_info.table_name', field:'db_table_info.table_name', width:150, name:"Table Name", groupable:false}},

            {select:"db_table_info.reads", display:{id:'db_table_info.reads', field:'db_table_info.reads', width:150, name:"Reads", groupable:false}},
            {select:"SUM(db_table_info.reads)", display:{id:'SUM(db_table_info.reads)', field:'SUM(db_table_info.reads)', width:150, name:"SUM (Reads)", groupable:false}},
            {select:"MIN(db_table_info.reads)", display:{id:'MIN(db_table_info.reads)', field:'MIN(db_table_info.reads)', width:150, name:"MIN (Reads)", groupable:false}},
            {select:"MAX(db_table_info.reads)", display:{id:'MAX(db_table_info.reads)', field:'MAX(db_table_info.reads)', width:150, name:"MAX (Reads)", groupable:false}},

            {select:"db_table_info.read_fails", display:{id:'db_table_info.read_fails', field:'db_table_info.read_fails', width:150, name:"read_fails", groupable:false}},
            {select:"SUM(db_table_info.read_fails)", display:{id:'SUM(db_table_info.read_fails)', field:'SUM(db_table_info.read_fails)', width:150, name:"SUM (Read Fails)", groupable:false}},
            {select:"MIN(db_table_info.read_fails)", display:{id:'MIN(db_table_info.read_fails)', field:'MIN(db_table_info.read_fails)', width:150, name:"MIN (Read Fails)", groupable:false}},
            {select:"MAX(db_table_info.read_fails)", display:{id:'MAX(db_table_info.read_fails)', field:'MAX(db_table_info.read_fails)', width:150, name:"MAX (Read Fails)", groupable:false}},

            {select:"db_table_info.writes", display:{id:'db_table_info.writes', field:'db_table_info.writes', width:150, name:"Writes", groupable:false}},
            {select:"SUM(db_table_info.writes)", display:{id:'SUM(db_table_info.writes)', field:'SUM(db_table_info.writes)', width:150, name:"SUM (Writes)", groupable:false}},
            {select:"MIN(db_table_info.writes)", display:{id:'MIN(db_table_info.writes)', field:'MIN(db_table_info.writes)', width:150, name:"MIN (Writes)", groupable:false}},
            {select:"MAX(db_table_info.writes)", display:{id:'MAX(db_table_info.writes)', field:'MAX(db_table_info.writes)', width:150, name:"MAX (Writes)", groupable:false}},

            {select:"db_table_info.write_fails", display:{id:'db_table_info.write_fails', field:'db_table_info.write_fails', width:150, name:"Write Fails", groupable:false}},
            {select:"SUM(db_table_info.write_fails)", display:{id:'SUM(db_table_info.write_fails)', field:'SUM(db_table_info.write_fails)', width:180, name:"SUM (Write Fails)", groupable:false}},
            {select:"MIN(db_table_info.write_fails)", display:{id:'MIN(db_table_info.write_fails)', field:'MIN(db_table_info.write_fails)', width:180, name:"MIN (Write Fails)", groupable:false}},
            {select:"MAX(db_table_info.write_fails)", display:{id:'MAX(db_table_info.write_fails)', field:'MAX(db_table_info.write_fails)', width:180, name:"MAX (Write Fails)", groupable:false}},

        ],
        "StatTable.ProtobufCollectorStats.db_statistics_table_info" : [
            {select:"COUNT(db_statistics_table_info)", display:{id:'COUNT(db_statistics_table_info)', field:'COUNT(db_statistics_table_info)', width:150, name:"Count (Table Info)", groupable:false}},
            {select:"db_statistics_table_info.table_name", display:{id:'db_statistics_table_info.table_name', field:'db_statistics_table_info.table_name', width:150, name:"Table Name", groupable:false}},

            {select:"db_statistics_table_info.reads", display:{id:'db_statistics_table_info.reads', field:'db_statistics_table_info.reads', width:150, name:"Reads", groupable:false}},
            {select:"SUM(db_statistics_table_info.reads)", display:{id:'SUM(db_statistics_table_info.reads)', field:'SUM(db_statistics_table_info.reads)', width:150, name:"SUM (Reads)", groupable:false}},
            {select:"MIN(db_statistics_table_info.reads)", display:{id:'MIN(db_statistics_table_info.reads)', field:'MIN(db_statistics_table_info.reads)', width:150, name:"MIN (Reads)", groupable:false}},
            {select:"MAX(db_statistics_table_info.reads)", display:{id:'MAX(db_statistics_table_info.reads)', field:'MAX(db_statistics_table_info.reads)', width:150, name:"MAX (Reads)", groupable:false}},

            {select:"db_statistics_table_info.read_fails", display:{id:'db_statistics_table_info.read_fails', field:'db_statistics_table_info.read_fails', width:180, name:"read_fails", groupable:false}},
            {select:"SUM(db_statistics_table_info.read_fails)", display:{id:'SUM(db_statistics_table_info.read_fails)', field:'SUM(db_statistics_table_info.read_fails)', width:180, name:"SUM (Read Fails)", groupable:false}},
            {select:"MIN(db_statistics_table_info.read_fails)", display:{id:'MIN(db_statistics_table_info.read_fails)', field:'MIN(db_statistics_table_info.read_fails)', width:180, name:"MIN (Read Fails)", groupable:false}},
            {select:"MAX(db_statistics_table_info.read_fails)", display:{id:'MAX(db_statistics_table_info.read_fails)', field:'MAX(db_statistics_table_info.read_fails)', width:180, name:"MAX (Read Fails)", groupable:false}},

            {select:"db_statistics_table_info.writes", display:{id:'db_statistics_table_info.writes', field:'db_statistics_table_info.writes', width:150, name:"Writes", groupable:false}},
            {select:"SUM(db_statistics_table_info.writes)", display:{id:'SUM(db_statistics_table_info.writes)', field:'SUM(db_statistics_table_info.writes)', width:150, name:"SUM (Writes)", groupable:false}},
            {select:"MIN(db_statistics_table_info.writes)", display:{id:'MIN(db_statistics_table_info.writes)', field:'MIN(db_statistics_table_info.writes)', width:150, name:"MIN (Writes)", groupable:false}},
            {select:"MAX(db_statistics_table_info.writes)", display:{id:'MAX(db_statistics_table_info.writes)', field:'MAX(db_statistics_table_info.writes)', width:150, name:"MAX (Writes)", groupable:false}},

            {select:"db_statistics_table_info.write_fails", display:{id:'db_statistics_table_info.write_fails', field:'db_statistics_table_info.write_fails', width:180, name:"Write Fails", groupable:false}},
            {select:"SUM(db_statistics_table_info.write_fails)", display:{id:'SUM(db_statistics_table_info.write_fails)', field:'SUM(db_statistics_table_info.write_fails)', width:180, name:"SUM (Write Fails)", groupable:false}},
            {select:"MIN(db_statistics_table_info.write_fails)", display:{id:'MIN(db_statistics_table_info.write_fails)', field:'MIN(db_statistics_table_info.write_fails)', width:180, name:"MIN (Write Fails)", groupable:false}},
            {select:"MAX(db_statistics_table_info.write_fails)", display:{id:'MAX(db_statistics_table_info.write_fails)', field:'MAX(db_statistics_table_info.write_fails)', width:180, name:"MAX (Write Fails)", groupable:false}},

        ],
        "StatTable.ProtobufCollectorStats.db_errors" : [
            {select:"COUNT(db_errors)", display:{id:'COUNT(db_errors)', field:'COUNT(db_errors)', width:150, name:"Count (DB Errors)", groupable:false}},

            {select:"db_errors.write_tablespace_fails", display:{id:'db_errors.write_tablespace_fails', field:'db_errors.write_tablespace_fails', width:190, name:"Write Tablespace Fails", groupable:false}},
            {select:"SUM(db_errors.write_tablespace_fails)", display:{id:'SUM(db_errors.write_tablespace_fails)', field:'SUM(db_errors.write_tablespace_fails)', width:190, name:"SUM (Write Tablespace Fails)", groupable:false}},
            {select:"MIN(db_errors.write_tablespace_fails)", display:{id:'MIN(db_errors.write_tablespace_fails)', field:'MIN(db_errors.write_tablespace_fails)', width:190, name:"MIN (Write Tablespace Fails)", groupable:false}},
            {select:"MAX(db_errors.write_tablespace_fails)", display:{id:'MAX(db_errors.write_tablespace_fails)', field:'MAX(db_errors.write_tablespace_fails)', width:190, name:"MAX (Write Tablespace Fails)", groupable:false}},

            {select:"db_errors.read_tablespace_fails", display:{id:'db_errors.read_tablespace_fails', field:'db_errors.read_tablespace_fails', width:190, name:"Read Tablespace Fails", groupable:false}},
            {select:"SUM(db_errors.read_tablespace_fails)", display:{id:'SUM(db_errors.read_tablespace_fails)', field:'SUM(db_errors.read_tablespace_fails)', width:190, name:"SUM (Read Tablespace Fails)", groupable:false}},
            {select:"MIN(db_errors.read_tablespace_fails)", display:{id:'MIN(db_errors.read_tablespace_fails)', field:'MIN(db_errors.read_tablespace_fails)', width:190, name:"MIN (Read Tablespace Fails)", groupable:false}},
            {select:"MAX(db_errors.read_tablespace_fails)", display:{id:'MAX(db_errors.read_tablespace_fails)', field:'MAX(db_errors.read_tablespace_fails)', width:190, name:"MAX (Read Tablespace Fails)", groupable:false}},

            {select:"db_errors.write_table_fails", display:{id:'db_errors.write_table_fails', field:'db_errors.write_table_fails', width:180, name:"Write Table Fails", groupable:false}},
            {select:"SUM(db_errors.write_table_fails)", display:{id:'SUM(db_errors.write_table_fails)', field:'SUM(db_errors.write_table_fails)', width:180, name:"SUM (Write Table Fails)", groupable:false}},
            {select:"MIN(db_errors.write_table_fails)", display:{id:'MIN(db_errors.write_table_fails)', field:'MIN(db_errors.write_table_fails)', width:180, name:"MIN (Write Table Fails)", groupable:false}},
            {select:"MAX(db_errors.write_table_fails)", display:{id:'MAX(db_errors.write_table_fails)', field:'MAX(db_errors.write_table_fails)', width:180, name:"MAX (Write Table Fails)", groupable:false}},

            {select:"db_errors.read_table_fails", display:{id:'db_errors.read_table_fails', field:'db_errors.read_table_fails', width:180, name:"Read Table Fails", groupable:false}},
            {select:"SUM(db_errors.read_table_fails)", display:{id:'SUM(db_errors.read_table_fails)', field:'SUM(db_errors.read_table_fails)', width:180, name:"SUM (Read Table Fails)", groupable:false}},
            {select:"MIN(db_errors.read_table_fails)", display:{id:'MIN(db_errors.read_table_fails)', field:'MIN(db_errors.read_table_fails)', width:180, name:"MIN (Read Table Fails)", groupable:false}},
            {select:"MAX(db_errors.read_table_fails)", display:{id:'MAX(db_errors.read_table_fails)', field:'MAX(db_errors.read_table_fails)', width:180, name:"MAX (Read Table Fails)", groupable:false}},

            {select:"db_errors.write_column_fails", display:{id:'db_errors.write_column_fails', field:'db_errors.write_column_fails', width:190, name:"Write Column Fails", groupable:false}},
            {select:"SUM(db_errors.write_column_fails)", display:{id:'SUM(db_errors.write_column_fails)', field:'SUM(db_errors.write_column_fails)', width:190, name:"SUM (Write Column Fails)", groupable:false}},
            {select:"MIN(db_errors.write_column_fails)", display:{id:'MIN(db_errors.write_column_fails)', field:'MIN(db_errors.write_column_fails)', width:190, name:"MIN (Write Column Fails)", groupable:false}},
            {select:"MAX(db_errors.write_column_fails)", display:{id:'MAX(db_errors.write_column_fails)', field:'MAX(db_errors.write_column_fails)', width:190, name:"MAX (Write Column Fails)", groupable:false}},

            {select:"db_errors.write_batch_column_fails", display:{id:'db_errors.write_batch_column_fails', field:'db_errors.write_batch_column_fails', width:210, name:"Write Batch Column Fails", groupable:false}},
            {select:"SUM(db_errors.write_batch_column_fails)", display:{id:'SUM(db_errors.write_batch_column_fails)', field:'SUM(db_errors.write_batch_column_fails)', width:210, name:"SUM (Write Batch Column Fails)", groupable:false}},
            {select:"MIN(db_errors.write_batch_column_fails)", display:{id:'MIN(db_errors.write_batch_column_fails)', field:'MIN(db_errors.write_batch_column_fails)', width:210, name:"MIN (Write Batch Column Fails)", groupable:false}},
            {select:"MAX(db_errors.write_batch_column_fails)", display:{id:'MAX(db_errors.write_batch_column_fails)', field:'MAX(db_errors.write_batch_column_fails)', width:210, name:"MAX (Write Batch Column Fails)", groupable:false}},

            {select:"db_errors.read_column_fails", display:{id:'db_errors.read_column_fails', field:'db_errors.read_column_fails', width:190, name:"Read Column Fails", groupable:false}},
            {select:"SUM(db_errors.read_column_fails)", display:{id:'SUM(db_errors.read_column_fails)', field:'SUM(db_errors.read_column_fails)', width:190, name:"SUM (Read Column Fails)", groupable:false}},
            {select:"MIN(db_errors.read_column_fails)", display:{id:'MIN(db_errors.read_column_fails)', field:'MIN(db_errors.read_column_fails)', width:190, name:"MIN (Read Column Fails)", groupable:false}},
            {select:"MAX(db_errors.read_column_fails)", display:{id:'MAX(db_errors.read_column_fails)', field:'MAX(db_errors.read_column_fails)', width:190, name:"MAX (Read Column Fails)", groupable:false}},
        ],


        "StatTable.PFEHeapInfo.heap_info" : [
            {select:"heap_info.name", display:{id:'heap_info.name', field:'heap_info.name', width:150, name:"Heap Info Name", groupable:false}},
            {select:"COUNT(heap_info)", display:{id:'COUNT(heap_info)', field:'COUNT(heap_info)', width:120, name:"Count (Heap Info)", groupable:false}},

            {select:"heap_info.size", display:{id:'heap_info.size', field:'heap_info.size', width:150, name:"Size", groupable:false}},
            {select:"SUM(heap_info.size)", display:{id:'SUM(heap_info.size)', field:'SUM(heap_info.size)', width:150, name:"SUM (Size)", groupable:false}},
            {select:"MIN(heap_info.size)", display:{id:'MIN(heap_info.size)', field:'MIN(heap_info.size)', width:150, name:"MIN (Size)", groupable:false}},
            {select:"MAX(heap_info.size)", display:{id:'MAX(heap_info.size)', field:'MAX(heap_info.size)', width:150, name:"MAX (Size)", groupable:false}},

            {select:"heap_info.allocated", display:{id:'heap_info.allocated', field:'heap_info.allocated', width:150, name:"Allocated", groupable:false}},
            {select:"MIN(heap_info.allocated)", display:{id:'MIN(heap_info.allocated)', field:'MIN(heap_info.allocated)', width:150, name:"MIN (Allocated)", groupable:false}},
            {select:"SUM(heap_info.allocated)", display:{id:'SUM(heap_info.allocated)', field:'SUM(heap_info.allocated)', width:150, name:"SUM (Allocated)", groupable:false}},
            {select:"MAX(heap_info.allocated)", display:{id:'MAX(heap_info.allocated)', field:'MAX(heap_info.allocated)', width:150, name:"MAX (Allocated)", groupable:false}},

            {select:"heap_info.utilization", display:{id:'heap_info.utilization', field:'heap_info.utilization', width:150, name:"Heap Info Utilization", groupable:false}},
            {select:"SUM(heap_info.utilization)", display:{id:'SUM(heap_info.utilization)', field:'SUM(heap_info.utilization)', width:150, name:"SUM (Utilization)", groupable:false}},
            {select:"MIN(heap_info.utilization)", display:{id:'MIN(heap_info.utilization)', field:'MIN(heap_info.utilization)', width:150, name:"MIN (Utilization)", groupable:false}},
            {select:"MAX(heap_info.utilization)", display:{id:'MAX(heap_info.utilization)', field:'MAX(heap_info.utilization)', width:150, name:"MAX (Utilization)", groupable:false}}
        ],
        "StatTable.npu_mem.stats" : [
            {select:"COUNT(stats)", display:{id:'COUNT(stats)', field:'COUNT(stats)', width:120, name:"Count (Stats)", groupable:false}},
            {select:"stats.pfe_identifier", display:{id:'stats.pfe_identifier', field:'stats.pfe_identifier', width:150, name:"PFE Identifier", groupable:false}},
            {select:"stats.resource_name", display:{id:'stats.resource_name', field:'stats.resource_name', width:150, name:"Resource Name", groupable:false}},

            {select:"stats.size", display:{id:'stats.size', field:'stats.size', width:150, name:"Size", groupable:false}},
            {select:"SUM(stats.size)", display:{id:'SUM(stats.size)', field:'SUM(stats.size)', width:150, name:"SUM (Size)", groupable:false}},
            {select:"MIN(stats.size)", display:{id:'MIN(stats.size)', field:'MIN(stats.size)', width:150, name:"MIN (Size)", groupable:false}},
            {select:"MAX(stats.size)", display:{id:'MAX(stats.size)', field:'MAX(stats.size)', width:150, name:"MAX (Size)", groupable:false}},

            {select:"stats.allocated", display:{id:'stats.allocated', field:'stats.allocated', width:150, name:"Allocated", groupable:false}},
            {select:"SUM(stats.allocated)", display:{id:'SUM(stats.allocated)', field:'SUM(stats.allocated)', width:150, name:"SUM (Allocated)", groupable:false}},
            {select:"MIN(stats.allocated)", display:{id:'MIN(stats.allocated)', field:'MIN(stats.allocated)', width:150, name:"MIN (Allocated)", groupable:false}},
            {select:"MAX(stats.allocated)", display:{id:'MAX(stats.allocated)', field:'MAX(stats.allocated)', width:150, name:"MAX (Allocated)", groupable:false}},

            {select:"stats.utilization", display:{id:'stats.utilization', field:'stats.utilization', width:150, name:"Utilization", groupable:false}},
            {select:"SUM(stats.utilization)", display:{id:'SUM(stats.utilization)', field:'SUM(stats.utilization)', width:150, name:"SUM (Utilization)", groupable:false}},
            {select:"MIN(stats.utilization)", display:{id:'MIN(stats.utilization)', field:'MIN(stats.utilization)', width:150, name:"MIN (Utilization)", groupable:false}},
            {select:"MAX(stats.utilization)", display:{id:'MAX(stats.utilization)', field:'MAX(stats.utilization)', width:150, name:"MAX (Utilization)", groupable:false}},
        ],
        "StatTable.fabric_message.edges.class_stats.transmit_counts" : [
            {select:"COUNT(edges)", display:{id:'COUNT(edges)', field:'COUNT(edges)', width:120, name:"Count (Edges)", groupable:false}},
            {select:"edges.src_type", display:{id:'edges.src_type', field:'edges.src_type', width:150, name:"Src Type", groupable:false}},
            {select:"edges.src_slot", display:{id:'edges.src_slot', field:'edges.src_slot', width:150, name:"Src Slot", groupable:false}},
            {select:"edges.src_pfe", display:{id:'edges.src_pfe', field:'edges.src_pfe', width:150, name:"Src PFE", groupable:false}},
            {select:"edges.dst_type", display:{id:'edges.dst_type', field:'edges.dst_type', width:150, name:"Dest Type", groupable:false}},
            {select:"edges.dst_slot", display:{id:'edges.dst_slot', field:'edges.dst_slot', width:150, name:"Dest Slot", groupable:false}},
            {select:"edges.dst_pfe", display:{id:'edges.dst_pfe', field:'edges.dst_pfe', width:150, name:"Dest PFE", groupable:false}},
            {select:"edges.class_stats.priority", display:{id:'edges.class_stats.priority', field:'edges.class_stats.priority', width:150, name:"Priority", groupable:false}},

            {select:"edges.class_stats.transmit_counts.packets", display:{id:'edges.class_stats.transmit_counts.packets', field:'edges.class_stats.transmit_counts.packets', width:150, name:"Trans Pkt Cnt", groupable:false}},
            {select:"SUM(edges.class_stats.transmit_counts.packets)", display:{id:'SUM(edges.class_stats.transmit_counts.packets)', field:'SUM(edges.class_stats.transmit_counts.packets)', width:150, name:"SUM (Trans Pkt Cnt)", groupable:false}},
            {select:"MIN(edges.class_stats.transmit_counts.packets)", display:{id:'MIN(edges.class_stats.transmit_counts.packets)', field:'MIN(edges.class_stats.transmit_counts.packets)', width:150, name:"MIN (Trans Pkt Cnt)", groupable:false}},
            {select:"MAX(edges.class_stats.transmit_counts.packets)", display:{id:'MAX(edges.class_stats.transmit_counts.packets)', field:'MAX(edges.class_stats.transmit_counts.packets)', width:150, name:"MAX (Trans Pkt Cnt)", groupable:false}},

            {select:"edges.class_stats.transmit_counts.pps", display:{id:'edges.class_stats.transmit_counts.pps', field:'edges.class_stats.transmit_counts.pps', width:150, name:"Trans PPS Cnt", groupable:false}},
            {select:"SUM(edges.class_stats.transmit_counts.pps)", display:{id:'SUM(edges.class_stats.transmit_counts.pps)', field:'SUM(edges.class_stats.transmit_counts.pps)', width:150, name:"SUM (Trans PPS Cnt)", groupable:false}},
            {select:"MIN(edges.class_stats.transmit_counts.pps)", display:{id:'MIN(edges.class_stats.transmit_counts.pps)', field:'MIN(edges.class_stats.transmit_counts.pps)', width:150, name:"MIN (Trans PPS Cnt)", groupable:false}},
            {select:"MAX(edges.class_stats.transmit_counts.pps)", display:{id:'MAX(edges.class_stats.transmit_counts.pps)', field:'MAX(edges.class_stats.transmit_counts.pps)', width:150, name:"MAX (Trans PPS Cnt)", groupable:false}},

            {select:"edges.class_stats.transmit_counts.bytes", display:{id:'edges.class_stats.transmit_counts.bytes', field:'edges.class_stats.transmit_counts.bytes', width:150, name:"Trans Bytes Cnt", groupable:false}},
            {select:"SUM(edges.class_stats.transmit_counts.bytes)", display:{id:'SUM(edges.class_stats.transmit_counts.bytes)', field:'SUM(edges.class_stats.transmit_counts.bytes)', width:150, name:"SUM (Trans Bytes Cnt)", groupable:false}},
            {select:"MIN(edges.class_stats.transmit_counts.bytes)", display:{id:'MIN(edges.class_stats.transmit_counts.bytes)', field:'MIN(edges.class_stats.transmit_counts.bytes)', width:150, name:"MIN (Trans Bytes Cnt)", groupable:false}},
            {select:"MAX(edges.class_stats.transmit_counts.bytes)", display:{id:'MAX(edges.class_stats.transmit_counts.bytes)', field:'MAX(edges.class_stats.transmit_counts.bytes)', width:150, name:"MAX (Trans Bytes Cnt)", groupable:false}},

            {select:"edges.class_stats.transmit_counts.bps", display:{id:'edges.class_stats.transmit_counts.bps', field:'edges.class_stats.transmit_counts.bps', width:150, name:"Trans BPS Cnt", groupable:false}},
            {select:"SUM(edges.class_stats.transmit_counts.bps)", display:{id:'SUM(edges.class_stats.transmit_counts.bps)', field:'SUM(edges.class_stats.transmit_counts.bps)', width:150, name:"SUM (Trans BPS Cnt)", groupable:false}},
            {select:"MIN(edges.class_stats.transmit_counts.bps)", display:{id:'MIN(edges.class_stats.transmit_counts.bps)', field:'MIN(edges.class_stats.transmit_counts.bps)', width:150, name:"MIN (Trans BPS Cnt)", groupable:false}},
            {select:"MAX(edges.class_stats.transmit_counts.bps)", display:{id:'MAX(edges.class_stats.transmit_counts.bps)', field:'MAX(edges.class_stats.transmit_counts.bps)', width:150, name:"MAX (Trans BPS Cnt)", groupable:false}},

            {select:"edges.class_stats.transmit_counts.drop_packets", display:{id:'edges.class_stats.transmit_counts.drop_packets', field:'edges.class_stats.transmit_counts.drop_packets', width:150, name:"Trans Drop Pkts Cnt", groupable:false}},
            {select:"SUM(edges.class_stats.transmit_counts.drop_packets)", display:{id:'SUM(edges.class_stats.transmit_counts.drop_packets)', field:'SUM(edges.class_stats.transmit_counts.drop_packets)', width:150, name:"SUM (Trans Drop Pkts Cnt)", groupable:false}},
            {select:"MIN(edges.class_stats.transmit_counts.drop_packets)", display:{id:'MIN(edges.class_stats.transmit_counts.drop_packets)', field:'MIN(edges.class_stats.transmit_counts.drop_packets)', width:150, name:"MIN (Trans Drop Pkts Cnt)", groupable:false}},
            {select:"MAX(edges.class_stats.transmit_counts.drop_packets)", display:{id:'MAX(edges.class_stats.transmit_counts.drop_packets)', field:'MAX(edges.class_stats.transmit_counts.drop_packets)', width:150, name:"MAX (Trans Drop Pkts Cnt)", groupable:false}},

            {select:"edges.class_stats.transmit_counts.drop_bytes", display:{id:'edges.class_stats.transmit_counts.drop_bytes', field:'edges.class_stats.transmit_counts.drop_bytes', width:150, name:"Trans Drop Bytes Cnt", groupable:false}},
            {select:"SUM(edges.class_stats.transmit_counts.drop_bytes)", display:{id:'SUM(edges.class_stats.transmit_counts.drop_bytes)', field:'SUM(edges.class_stats.transmit_counts.drop_bytes)', width:150, name:"SUM (Trans Drop Bytes Cnt)", groupable:false}},
            {select:"MIN(edges.class_stats.transmit_counts.drop_bytes)", display:{id:'MIN(edges.class_stats.transmit_counts.drop_bytes)', field:'MIN(edges.class_stats.transmit_counts.drop_bytes)', width:150, name:"MIN (Trans Drop Bytes Cnt)", groupable:false}},
            {select:"MAX(edges.class_stats.transmit_counts.drop_bytes)", display:{id:'MAX(edges.class_stats.transmit_counts.drop_bytes)', field:'MAX(edges.class_stats.transmit_counts.drop_bytes)', width:150, name:"MAX (Trans Drop Bytes Cnt)", groupable:false}},

            {select:"edges.class_stats.transmit_counts.drop_bps", display:{id:'edges.class_stats.transmit_counts.drop_bps', field:'edges.class_stats.transmit_counts.drop_bps', width:150, name:"Trans Drop BPS Cnt", groupable:false}},
            {select:"SUM(edges.class_stats.transmit_counts.drop_bps)", display:{id:'SUM(edges.class_stats.transmit_counts.drop_bps)', field:'SUM(edges.class_stats.transmit_counts.drop_bps)', width:150, name:"SUM (Trans Drop BPS Cnt)", groupable:false}},
            {select:"MIN(edges.class_stats.transmit_counts.drop_bps)", display:{id:'MIN(edges.class_stats.transmit_counts.drop_bps)', field:'MIN(edges.class_stats.transmit_counts.drop_bps)', width:150, name:"MIN (Trans Drop BPS Cnt)", groupable:false}},
            {select:"MAX(edges.class_stats.transmit_counts.drop_bps)", display:{id:'MAX(edges.class_stats.transmit_counts.drop_bps)', field:'MAX(edges.class_stats.transmit_counts.drop_bps)', width:150, name:"MAX (Trans Drop BPS Cnt)", groupable:false}},

            {select:"edges.class_stats.transmit_counts.drop_pps", display:{id:'edges.class_stats.transmit_counts.drop_pps', field:'edges.class_stats.transmit_counts.drop_pps', width:150, name:"Trans Drop PPS Cnt", groupable:false}},
            {select:"SUM(edges.class_stats.transmit_counts.drop_pps)", display:{id:'SUM(edges.class_stats.transmit_counts.drop_pps)', field:'SUM(edges.class_stats.transmit_counts.drop_pps)', width:150, name:"SUM (Trans Drop PPS Cnt)", groupable:false}},
            {select:"MIN(edges.class_stats.transmit_counts.drop_pps)", display:{id:'MIN(edges.class_stats.transmit_counts.drop_pps)', field:'MIN(edges.class_stats.transmit_counts.drop_pps)', width:150, name:"MIN (Trans Drop PPS Cnt)", groupable:false}},
            {select:"MAX(edges.class_stats.transmit_counts.drop_pps)", display:{id:'MAX(edges.class_stats.transmit_counts.drop_pps)', field:'MAX(edges.class_stats.transmit_counts.drop_pps)', width:150, name:"MAX (Trans Drop PPS Cnt)", groupable:false}},

            {select:"edges.class_stats.transmit_counts.q_depth_avg", display:{id:'edges.class_stats.transmit_counts.q_depth_avg', field:'edges.class_stats.transmit_counts.q_depth_avg', width:150, name:"Trans Avg Q Depth", groupable:false}},
            {select:"SUM(edges.class_stats.transmit_counts.q_depth_avg)", display:{id:'SUM(edges.class_stats.transmit_counts.q_depth_avg)', field:'SUM(edges.class_stats.transmit_counts.q_depth_avg)', width:150, name:"SUM (Trans Avg Q Depth)", groupable:false}},
            {select:"MIN(edges.class_stats.transmit_counts.q_depth_avg)", display:{id:'MIN(edges.class_stats.transmit_counts.q_depth_avg)', field:'MIN(edges.class_stats.transmit_counts.q_depth_avg)', width:150, name:"MIN (Trans Avg Q Depth)", groupable:false}},
            {select:"MAX(edges.class_stats.transmit_counts.q_depth_avg)", display:{id:'MAX(edges.class_stats.transmit_counts.q_depth_avg)', field:'MAX(edges.class_stats.transmit_counts.q_depth_avg)', width:150, name:"MAX (Trans Avg Q Depth)", groupable:false}},

            {select:"edges.class_stats.transmit_counts.q_depth_cur", display:{id:'edges.class_stats.transmit_counts.q_depth_cur', field:'edges.class_stats.transmit_counts.q_depth_cur', width:150, name:"Trans Cur Q Depth", groupable:false}},
            {select:"SUM(edges.class_stats.transmit_counts.q_depth_cur)", display:{id:'SUM(edges.class_stats.transmit_counts.q_depth_cur)', field:'SUM(edges.class_stats.transmit_counts.q_depth_cur)', width:150, name:"SUM (Trans Cur Q Depth)", groupable:false}},
            {select:"MIN(edges.class_stats.transmit_counts.q_depth_cur)", display:{id:'MIN(edges.class_stats.transmit_counts.q_depth_cur)', field:'MIN(edges.class_stats.transmit_counts.q_depth_cur)', width:150, name:"MIN (Trans Cur Q Depth)", groupable:false}},
            {select:"MAX(edges.class_stats.transmit_counts.q_depth_cur)", display:{id:'MAX(edges.class_stats.transmit_counts.q_depth_cur)', field:'MAX(edges.class_stats.transmit_counts.q_depth_cur)', width:150, name:"MAX (Trans Cur Q Depth)", groupable:false}},

            {select:"edges.class_stats.transmit_counts.q_depth_peak", display:{id:'edges.class_stats.transmit_counts.q_depth_peak', field:'edges.class_stats.transmit_counts.q_depth_peak', width:150, name:"Trans Peak Q Depth", groupable:false}},
            {select:"SUM(edges.class_stats.transmit_counts.q_depth_peak)", display:{id:'SUM(edges.class_stats.transmit_counts.q_depth_peak)', field:'SUM(edges.class_stats.transmit_counts.q_depth_peak)', width:150, name:"SUM (Trans Peak Q Depth)", groupable:false}},
            {select:"MIN(edges.class_stats.transmit_counts.q_depth_peak)", display:{id:'MIN(edges.class_stats.transmit_counts.q_depth_peak)', field:'MIN(edges.class_stats.transmit_counts.q_depth_peak)', width:150, name:"MIN (Trans Peak Q Depth)", groupable:false}},
            {select:"MAX(edges.class_stats.transmit_counts.q_depth_peak)", display:{id:'MAX(edges.class_stats.transmit_counts.q_depth_peak)', field:'MAX(edges.class_stats.transmit_counts.q_depth_peak)', width:150, name:"MAX (Trans PeakQ Depth)", groupable:false}},

            {select:"edges.class_stats.transmit_counts.q_depth_max", display:{id:'edges.class_stats.transmit_counts.q_depth_max', field:'edges.class_stats.transmit_counts.q_depth_max', width:150, name:"Trans Max Q Depth", groupable:false}},
            {select:"SUM(edges.class_stats.transmit_counts.q_depth_max)", display:{id:'SUM(edges.class_stats.transmit_counts.q_depth_max)', field:'SUM(edges.class_stats.transmit_counts.q_depth_max)', width:150, name:"SUM (Trans Max Q Depth)", groupable:false}},
            {select:"MIN(edges.class_stats.transmit_counts.q_depth_max)", display:{id:'MIN(edges.class_stats.transmit_counts.q_depth_max)', field:'MIN(edges.class_stats.transmit_counts.q_depth_max)', width:150, name:"MIN (Trans Max Q Depth)", groupable:false}},
            {select:"MAX(edges.class_stats.transmit_counts.q_depth_max)", display:{id:'MAX(edges.class_stats.transmit_counts.q_depth_max)', field:'MAX(edges.class_stats.transmit_counts.q_depth_max)', width:150, name:"MAX (Trans Max Q Depth)", groupable:false}},

        ],
        "StatTable.g_lsp_stats.lsp_records" : [
            {select:"COUNT(lsp_records)", display:{id:'COUNT(lsp_records)', field:'COUNT(lsp_records)', width:120, name:"Count (LSP Records)", groupable:false}},
            {select:"system_name", display:{id:'system_name', field:'system_name', width:150, name:"System Name", groupable:false}},
            {select:"sensor_name", display:{id:'sensor_name', field:'sensor_name', width:150, name:"Sensor Name", groupable:false}},
            {select:"lsp_records.name", display:{id:'lsp_records.name', field:'lsp_records.name', width:150, name:"Lsp Records Name", groupable:false}},

            {select:"slot", display:{id:'slot', field:'slot', width:150, name:"Slot", groupable:false}},
            {select:"SUM(slot)", display:{id:'SUM(slot)', field:'SUM(slot)', width:150, name:"SUM (Slot)", groupable:false}},
            {select:"MIN(slot)", display:{id:'MIN(slot)', field:'MIN(slot)', width:150, name:"MIN (Slot)", groupable:false}},
            {select:"MAX(slot)", display:{id:'MAX(slot)', field:'MAX(slot)', width:150, name:"MAX (Slot)", groupable:false}},

            {select:"timestamp", display:{id:'timestamp', field:'timestamp', width:150, name:"Timestamp", groupable:false}},
            {select:"SUM(timestamp)", display:{id:'SUM(timestamp)', field:'SUM(timestamp)', width:150, name:"SUM (Timestamp)", groupable:false}},
            {select:"MIN(timestamp)", display:{id:'MIN(timestamp)', field:'MIN(timestamp)', width:150, name:"MIN (Timestamp)", groupable:false}},
            {select:"MAX(timestamp)", display:{id:'MAX(timestamp)', field:'MAX(timestamp)', width:150, name:"MAX (Timestamp)", groupable:false}},

            {select:"lsp_records.instance_identifier", display:{id:'lsp_records.instance_identifier', field:'lsp_records.instance_identifier', width:150, name:"Instance Identifier", groupable:false}},
            {select:"SUM(lsp_records.instance_identifier)", display:{id:'SUM(lsp_records.instance_identifier)', field:'SUM(lsp_records.instance_identifier)', width:150, name:"SUM (Instance Identifier)", groupable:false}},
            {select:"MIN(lsp_records.instance_identifier)", display:{id:'MIN(lsp_records.instance_identifier)', field:'MIN(lsp_records.instance_identifier)', width:150, name:"MIN (Instance Identifier)", groupable:false}},
            {select:"MAX(lsp_records.instance_identifier)", display:{id:'MAX(lsp_records.instance_identifier)', field:'MAX(lsp_records.instance_identifier)', width:150, name:"MAX (Instance Identifier)", groupable:false}},

            {select:"lsp_records.counter_name", display:{id:'lsp_records.counter_name', field:'lsp_records.counter_name', width:150, name:"Counter Name", groupable:false}},
            {select:"SUM(lsp_records.counter_name)", display:{id:'SUM(lsp_records.counter_name)', field:'SUM(lsp_records.counter_name)', width:150, name:"SUM (Counter Name)", groupable:false}},
            {select:"MIN(lsp_records.counter_name)", display:{id:'MIN(lsp_records.counter_name)', field:'MIN(lsp_records.counter_name)', width:150, name:"MIN (Counter Name)", groupable:false}},
            {select:"MAX(lsp_records.counter_name)", display:{id:'MAX(lsp_records.counter_name)', field:'MAX(lsp_records.counter_name)', width:150, name:"MAX (Counter Name)", groupable:false}},

            {select:"lsp_records.packets", display:{id:'lsp_records.packets', field:'lsp_records.packets', width:150, name:"Packets", groupable:false}},
            {select:"SUM(lsp_records.packets)", display:{id:'SUM(lsp_records.packets)', field:'SUM(lsp_records.packets)', width:150, name:"SUM (Packets)", groupable:false}},
            {select:"MIN(lsp_records.packets)", display:{id:'MIN(lsp_records.packets)', field:'MIN(lsp_records.packets)', width:150, name:"MIN (Packets)", groupable:false}},
            {select:"MAX(lsp_records.packets)", display:{id:'MAX(lsp_records.packets)', field:'MAX(lsp_records.packets)', width:150, name:"MAX (Packets)", groupable:false}},

            {select:"lsp_records.packet_rates", display:{id:'lsp_records.packet_rates', field:'lsp_records.packet_rates', width:150, name:"Packet Rates", groupable:false}},
            {select:"SUM(lsp_records.packet_rates)", display:{id:'SUM(lsp_records.packet_rates)', field:'SUM(lsp_records.packet_rates)', width:150, name:"SUM (Packet Rates)", groupable:false}},
            {select:"MIN(lsp_records.packet_rates)", display:{id:'MIN(lsp_records.packet_rates)', field:'MIN(lsp_records.packet_rates)', width:150, name:"MIN (Packet Rates)", groupable:false}},
            {select:"MAX(lsp_records.packet_rates)", display:{id:'MAX(lsp_records.packet_rates)', field:'MAX(lsp_records.packet_rates)', width:150, name:"MAX (Packet Rates)", groupable:false}},

            {select:"lsp_records.bytes", display:{id:'lsp_records.bytes', field:'lsp_records.bytes', width:150, name:"Bytes", groupable:false}},
            {select:"SUM(lsp_records.bytes)", display:{id:'SUM(lsp_records.bytes)', field:'SUM(lsp_records.bytes)', width:150, name:"SUM (Bytes)", groupable:false}},
            {select:"MIN(lsp_records.bytes)", display:{id:'MIN(lsp_records.bytes)', field:'MIN(lsp_records.bytes)', width:150, name:"MIN (Bytes)", groupable:false}},
            {select:"MAX(lsp_records.bytes)", display:{id:'MAX(lsp_records.bytes)', field:'MAX(lsp_records.bytes)', width:150, name:"MAX (Bytes)", groupable:false}},

            {select:"lsp_records.byte_rates", display:{id:'lsp_records.byte_rates', field:'lsp_records.byte_rates', width:150, name:"Byte Rates", groupable:false}},
            {select:"SUM(lsp_records.byte_rates)", display:{id:'SUM(lsp_records.byte_rates)', field:'SUM(lsp_records.byte_rates)', width:150, name:"SUM (Byte Rates)", groupable:false}},
            {select:"MIN(lsp_records.byte_rates)", display:{id:'MIN(lsp_records.byte_rates)', field:'MIN(lsp_records.byte_rates)', width:150, name:"MIN (Byte Rates)", groupable:false}},
            {select:"MAX(lsp_records.byte_rates)", display:{id:'MAX(lsp_records.byte_rates)', field:'MAX(lsp_records.byte_rates)', width:150, name:"MAX (Byte Rates)", groupable:false}}
        ],
        "StatTable.UFlowData.flow" : [
            {select:"COUNT(flow)", display:{id:'COUNT(flow)', field:'COUNT(flow)', width:120, name:"Count (Flow)", groupable:false}},

            {select:"flow.pifindex", display:{id:'flow.pifindex', field:'flow.pifindex', width:150, name:"PIF Index", groupable:false}},
            {select:"SUM(flow.pifindex)", display:{id:'SUM(flow.pifindex)', field:'SUM(flow.pifindex)', width:150, name:"SUM (PIF Index)", groupable:false}},
            {select:"MIN(flow.pifindex)", display:{id:'MIN(flow.pifindex)', field:'MIN(flow.pifindex)', width:150, name:"MIN (PIF Index)", groupable:false}},
            {select:"MAX(flow.pifindex)", display:{id:'MAX(flow.pifindex)', field:'MAX(flow.pifindex)', width:150, name:"MAX (PIF Index)", groupable:false}},

            {select:"flow.sport", display:{id:'flow.sport', field:'flow.sport', width:150, name:"Src Port", groupable:false}},
            {select:"SUM(flow.sport)", display:{id:'SUM(flow.sport)', field:'SUM(flow.sport)', width:150, name:"SUM (Src Port)", groupable:false}},
            {select:"MIN(flow.sport)", display:{id:'MIN(flow.sport)', field:'MIN(flow.sport)', width:150, name:"MIN (Src Port)", groupable:false}},
            {select:"MAX(flow.sport)", display:{id:'MAX(flow.sport)', field:'MAX(flow.sport)', width:150, name:"MAX (Src Port)", groupable:false}},

            {select:"flow.dport", display:{id:'flow.dport', field:'flow.dport', width:150, name:"Dest Port", groupable:false}},
            {select:"SUM(flow.dport)", display:{id:'SUM(flow.dport)', field:'SUM(flow.dport)', width:150, name:"SUM (Dest Port)", groupable:false}},
            {select:"MIN(flow.dport)", display:{id:'MIN(flow.dport)', field:'MIN(flow.dport)', width:150, name:"MIN (Dest Port)", groupable:false}},
            {select:"MAX(flow.dport)", display:{id:'MAX(flow.dport)', field:'MAX(flow.dport)', width:150, name:"MAX (Dest Port)", groupable:false}},

            {select:"flow.protocol", display:{id:'flow.protocol', field:'flow.protocol', width:150, name:"Protocol", groupable:false}},
            {select:"SUM(flow.protocol)", display:{id:'SUM(flow.protocol)', field:'SUM(flow.protocol)', width:150, name:"SUM (Protocol)", groupable:false}},
            {select:"MIN(flow.protocol)", display:{id:'MIN(flow.protocol)', field:'MIN(flow.protocol)', width:150, name:"MIN (Protocol)", groupable:false}},
            {select:"MAX(flow.protocol)", display:{id:'MAX(flow.protocol)', field:'MAX(flow.protocol)', width:150, name:"MAX (Protocol)", groupable:false}},

            {select:"flow.sip", display:{id:'flow.sip', field:'flow.sip', width:150, name:"Src IP", groupable:false}},
            {select:"flow.dip", display:{id:'flow.dip', field:'flow.dip', width:150, name:"Dest IP", groupable:false}},
            {select:"flow.vlan", display:{id:'flow.vlan', field:'flow.vlan', width:150, name:"Virtual LAN", groupable:false}},
            {select:"flow.flowtype", display:{id:'flow.flowtype', field:'flow.flowtype', width:150, name:"Flow Type", groupable:false}},
            {select:"flow.otherinfo", display:{id:'flow.otherinfo', field:'flow.otherinfo', width:150, name:"Other Info", groupable:false}}
        ],
        "StatTable.AlarmgenUpdate.o" : [
            {select:"COUNT(o)", display:{id:'COUNT(o)', field:'COUNT(o)', width:120, name:"Count (o)", groupable:false}},
            {select:"instance", display:{id:'instance', field:'instance', width:150, name:"Instance", groupable:false}},
            {select:"table", display:{id:'table', field:'table', width:150, name:"Table", groupable:false}},
            {select:"o.key", display:{id:'o.key', field:'o.key', width:150, name:"Key", groupable:false}},

            {select:"partition", display:{id:'partition', field:'partition', width:150, name:"Partition", groupable:false}},
            {select:"SUM(partition)", display:{id:'SUM(partition)', field:'SUM(partition)', width:150, name:"SUM (Partition)", groupable:false}},
            {select:"MIN(partition)", display:{id:'MIN(partition)', field:'MIN(partition)', width:150, name:"MIN (Partition)", groupable:false}},
            {select:"MAX(partition)", display:{id:'MAX(partition)', field:'MAX(partition)', width:150, name:"MAX (Partition)", groupable:false}},

            {select:"o.count", display:{id:'o.count', field:'o.count', width:150, name:"o Cnt", groupable:false}},
            {select:"SUM(o.count)", display:{id:'SUM(o.count)', field:'SUM(o.count)', width:150, name:"SUM (o Cnt)", groupable:false}},
            {select:"MIN(o.count)", display:{id:'MIN(o.count)', field:'MIN(o.count)', width:150, name:"MIN (o Cnt)", groupable:false}},
            {select:"MAX(o.count)", display:{id:'MAX(o.count)', field:'MAX(o.count)', width:150, name:"MAX (o Cnt)", groupable:false}},
        ],
        "StatTable.AlarmgenUpdate.i" : [
            {select:"COUNT(i)", display:{id:'COUNT(i)', field:'COUNT(i)', width:120, name:"Count (i)", groupable:false}},
            {select:"instance", display:{id:'instance', field:'instance', width:150, name:"Instance", groupable:false}},
            {select:"table", display:{id:'table', field:'table', width:150, name:"Table", groupable:false}},
            {select:"i.generator", display:{id:'i.generator', field:'i.generator', width:150, name:"Generator", groupable:false}},
            {select:"i.collector", display:{id:'i.collector', field:'i.collector', width:150, name:"Collector", groupable:false}},
            {select:"i.type", display:{id:'i.type', field:'i.type', width:150, name:"Type", groupable:false}},

            {select:"partition", display:{id:'partition', field:'partition', width:150, name:"Partition", groupable:false}},
            {select:"SUM(partition)", display:{id:'SUM(partition)', field:'SUM(partition)', width:150, name:"SUM (Partition)", groupable:false}},
            {select:"MIN(partition)", display:{id:'MIN(partition)', field:'MIN(partition)', width:150, name:"MIN (Partition)", groupable:false}},
            {select:"MAX(partition)", display:{id:'MAX(partition)', field:'MAX(partition)', width:150, name:"MAX (Partition)", groupable:false}},

            {select:"i.count", display:{id:'i.count', field:'i.count', width:150, name:"i Cnt", groupable:false}},
            {select:"SUM(i.count)", display:{id:'SUM(i.count)', field:'SUM(i.count)', width:150, name:"SUM (i Cnt)", groupable:false}},
            {select:"MIN(i.count)", display:{id:'MIN(i.count)', field:'MIN(i.count)', width:150, name:"MIN (i Cnt)", groupable:false}},
            {select:"MAX(i.count)", display:{id:'MAX(i.count)', field:'MAX(i.count)', width:150, name:"MAX (i Cnt)", groupable:false}}
        ],

        "StatTable.AlarmgenStatus.counters" : [
            {select:"COUNT(counters)", display:{id:'COUNT(counters)', field:'COUNT(counters)', width:120, name:"Count (Counters)", groupable:false}},
            {select:"counters.instance", display:{id:'counters.instance', field:'counters.instance', width:150, name:"Instance", groupable:false}},

            {select:"counters.partitions", display:{id:'counters.partitions', field:'counters.partitions', width:150, name:"Partitions", groupable:false}},
            {select:"SUM(counters.partitions)", display:{id:'SUM(counters.partitions)', field:'SUM(counters.partitions)', width:150, name:"SUM (Partitions)", groupable:false}},
            {select:"MIN(counters.partitions)", display:{id:'MIN(counters.partitions)', field:'MIN(counters.partitions)', width:150, name:"MIN (Partitions)", groupable:false}},
            {select:"MAX(counters.partitions)", display:{id:'MAX(counters.partitions)', field:'MAX(counters.partitions)', width:150, name:"MAX (Partitions)", groupable:false}},

            {select:"counters.keys", display:{id:'counters.keys', field:'counters.keys', width:150, name:"Keys", groupable:false}},
            {select:"SUM(counters.keys)", display:{id:'SUM(counters.keys)', field:'SUM(counters.keys)', width:150, name:"SUM (Keys)", groupable:false}},
            {select:"MIN(counters.keys)", display:{id:'MIN(counters.keys)', field:'MIN(counters.keys)', width:150, name:"MIN (Keys)", groupable:false}},
            {select:"MAX(counters.keys)", display:{id:'MAX(counters.keys)', field:'MAX(counters.keys)', width:150, name:"MAX (Keys)", groupable:false}},

            {select:"counters.updates", display:{id:'counters.updates', field:'counters.updates', width:150, name:"Updates", groupable:false}},
            {select:"SUM(counters.updates)", display:{id:'SUM(counters.updates)', field:'SUM(counters.updates)', width:150, name:"SUM (Updates)", groupable:false}},
            {select:"MIN(counters.updates)", display:{id:'MIN(counters.updates)', field:'MIN(counters.updates)', width:150, name:"MIN (Updates)", groupable:false}},
            {select:"MAX(counters.updates)", display:{id:'MAX(counters.updates)', field:'MAX(counters.updates)', width:150, name:"MAX (Updates)", groupable:false}}
        ],

        "StatTable.UveLoadbalancer.virtual_ip_stats" : [
            {select:"COUNT(virtual_ip_stats)", display:{id:'COUNT(virtual_ip_stats)', field:'COUNT(virtual_ip_stats)', width:170, name:"Count (Virtual IP Stats)", groupable:false}},
            {select:"virtual_ip_stats.obj_name", display:{id:'virtual_ip_stats.obj_name', field:'virtual_ip_stats.obj_name', width:150, name:"Object Name", groupable:false}},
            {select:"virtual_ip_stats.uuid", display:{id:"virtual_ip_stats.uuid", field:"virtual_ip_stats.uuid", name:"Virtual IP Stats UUID",  width:280, groupable:true}},
            {select:"virtual_ip_stats.status", display:{id:"virtual_ip_stats.status", field:"virtual_ip_stats.status", name:"Status",  width:150, groupable:true}},
            {select:"virtual_ip_stats.vrouter", display:{id:"virtual_ip_stats.vrouter", field:"virtual_ip_stats.vrouter", name:"Vrouter",  width:150, groupable:true}},

            {select:"virtual_ip_stats.active_connections", display:{id:'virtual_ip_stats.active_connections', field:'virtual_ip_stats.active_connections', width:180, name:"Active Connections", groupable:false}},
            {select:"SUM(virtual_ip_stats.active_connections)", display:{id:'SUM(virtual_ip_stats.active_connections)', field:'SUM(virtual_ip_stats.active_connections)', width:180, name:"SUM (Active Connections)", groupable:false}},
            {select:"MIN(virtual_ip_stats.active_connections)", display:{id:'MIN(virtual_ip_stats.active_connections)', field:'MIN(virtual_ip_stats.active_connections)', width:180, name:"MIN (Active Connections)", groupable:false}},
            {select:"MAX(virtual_ip_stats.active_connections)", display:{id:'MAX(virtual_ip_stats.active_connections)', field:'MAX(virtual_ip_stats.active_connections)', width:180, name:"MAX (Active Connections)", groupable:false}},

            {select:"virtual_ip_stats.max_connections", display:{id:'virtual_ip_stats.max_connections', field:'virtual_ip_stats.max_connections', width:180, name:"Max Connections", groupable:false}},
            {select:"SUM(virtual_ip_stats.max_connections)", display:{id:'SUM(virtual_ip_stats.max_connections)', field:'SUM(virtual_ip_stats.max_connections)', width:180, name:"SUM (Max Connections)", groupable:false}},
            {select:"MIN(virtual_ip_stats.max_connections)", display:{id:'MIN(virtual_ip_stats.max_connections)', field:'MIN(virtual_ip_stats.max_connections)', width:180, name:"MIN (Max Connections)", groupable:false}},
            {select:"MAX(virtual_ip_stats.max_connections)", display:{id:'MAX(virtual_ip_stats.max_connections)', field:'MAX(virtual_ip_stats.max_connections)', width:180, name:"MAX (Max Connections)", groupable:false}},

            {select:"virtual_ip_stats.current_sessions", display:{id:'virtual_ip_stats.current_sessions', field:'virtual_ip_stats.current_sessions', width:180, name:"Current Sessions", groupable:false}},
            {select:"SUM(virtual_ip_stats.current_sessions)", display:{id:'SUM(virtual_ip_stats.current_sessions)', field:'SUM(virtual_ip_stats.current_sessions)', width:180, name:"SUM (Current Sessions)", groupable:false}},
            {select:"MIN(virtual_ip_stats.current_sessions)", display:{id:'MIN(virtual_ip_stats.current_sessions)', field:'MIN(virtual_ip_stats.current_sessions)', width:180, name:"MIN (Current Sessions)", groupable:false}},
            {select:"MAX(virtual_ip_stats.current_sessions)", display:{id:'MAX(virtual_ip_stats.current_sessions)', field:'MAX(virtual_ip_stats.current_sessions)', width:180, name:"MAX (Current Sessions)", groupable:false}},

            {select:"virtual_ip_stats.max_sessions", display:{id:'virtual_ip_stats.max_sessions', field:'virtual_ip_stats.max_sessions', width:180, name:"Max Sessions", groupable:false}},
            {select:"SUM(virtual_ip_stats.max_sessions)", display:{id:'SUM(virtual_ip_stats.max_sessions)', field:'SUM(virtual_ip_stats.max_sessions)', width:180, name:"SUM (Max Sessions)", groupable:false}},
            {select:"MIN(virtual_ip_stats.max_sessions)", display:{id:'MIN(virtual_ip_stats.max_sessions)', field:'MIN(virtual_ip_stats.max_sessions)', width:180, name:"MIN (Max Sessions)", groupable:false}},
            {select:"MAX(virtual_ip_stats.max_sessions)", display:{id:'MAX(virtual_ip_stats.max_sessions)', field:'MAX(virtual_ip_stats.max_sessions)', width:180, name:"MAX (Max Sessions)", groupable:false}},

            {select:"virtual_ip_stats.total_sessions", display:{id:'virtual_ip_stats.total_sessions', field:'virtual_ip_stats.total_sessions', width:180, name:"Total Sessions", groupable:false}},
            {select:"SUM(virtual_ip_stats.total_sessions)", display:{id:'SUM(virtual_ip_stats.total_sessions)', field:'SUM(virtual_ip_stats.total_sessions)', width:180, name:"SUM (Total Sessions)", groupable:false}},
            {select:"MIN(virtual_ip_stats.total_sessions)", display:{id:'MIN(virtual_ip_stats.total_sessions)', field:'MIN(virtual_ip_stats.total_sessions)', width:180, name:"MIN (Total Sessions)", groupable:false}},
            {select:"MAX(virtual_ip_stats.total_sessions)", display:{id:'MAX(virtual_ip_stats.total_sessions)', field:'MAX(virtual_ip_stats.total_sessions)', width:180, name:"MAX (Total Sessions)", groupable:false}},

            {select:"virtual_ip_stats.bytes_in", display:{id:'virtual_ip_stats.bytes_in', field:'virtual_ip_stats.bytes_in', width:150, name:"Bytes In", groupable:false}},
            {select:"SUM(virtual_ip_stats.bytes_in)", display:{id:'SUM(virtual_ip_stats.bytes_in)', field:'SUM(virtual_ip_stats.bytes_in)', width:150, name:"SUM (Bytes In)", groupable:false}},
            {select:"MIN(virtual_ip_stats.bytes_in)", display:{id:'MIN(virtual_ip_stats.bytes_in)', field:'MIN(virtual_ip_stats.bytes_in)', width:150, name:"MIN (Bytes In)", groupable:false}},
            {select:"MAX(virtual_ip_stats.bytes_in)", display:{id:'MAX(virtual_ip_stats.bytes_in)', field:'MAX(virtual_ip_stats.bytes_in)', width:150, name:"MAX (Bytes In)", groupable:false}},

            {select:"virtual_ip_stats.bytes_out", display:{id:'virtual_ip_stats.bytes_out', field:'virtual_ip_stats.bytes_out', width:150, name:"Bytes Out", groupable:false}},
            {select:"SUM(virtual_ip_stats.bytes_out)", display:{id:'SUM(virtual_ip_stats.bytes_out)', field:'SUM(virtual_ip_stats.bytes_out)', width:150, name:"SUM (Bytes Out)", groupable:false}},
            {select:"MIN(virtual_ip_stats.bytes_out)", display:{id:'MIN(virtual_ip_stats.bytes_out)', field:'MIN(virtual_ip_stats.bytes_out)', width:150, name:"MIN (Bytes Out)", groupable:false}},
            {select:"MAX(virtual_ip_stats.bytes_out)", display:{id:'MAX(virtual_ip_stats.bytes_out)', field:'MAX(virtual_ip_stats.bytes_out)', width:150, name:"MAX (Bytes Out)", groupable:false}},

            {select:"virtual_ip_stats.connection_errors", display:{id:'virtual_ip_stats.connection_errors', field:'virtual_ip_stats.connection_errors', width:180, name:"Connection Errors", groupable:false}},
            {select:"SUM(virtual_ip_stats.connection_errors)", display:{id:'SUM(virtual_ip_stats.connection_errors)', field:'SUM(virtual_ip_stats.connection_errors)', width:180, name:"SUM (Connection Errors)", groupable:false}},
            {select:"MIN(virtual_ip_stats.connection_errors)", display:{id:'MIN(virtual_ip_stats.connection_errors)', field:'MIN(virtual_ip_stats.connection_errors)', width:180, name:"MIN (Connection Errors)", groupable:false}},
            {select:"MAX(virtual_ip_stats.connection_errors)", display:{id:'MAX(virtual_ip_stats.connection_errors)', field:'MAX(virtual_ip_stats.connection_errors)', width:180, name:"MAX (Connection Errors)", groupable:false}},

            {select:"virtual_ip_stats.reponse_errors", display:{id:'virtual_ip_stats.reponse_errors', field:'virtual_ip_stats.reponse_errors', width:180, name:"Reponse Errors", groupable:false}},
            {select:"SUM(virtual_ip_stats.reponse_errors)", display:{id:'SUM(virtual_ip_stats.reponse_errors)', field:'SUM(virtual_ip_stats.reponse_errors)', width:180, name:"SUM (Reponse Errors)", groupable:false}},
            {select:"MIN(virtual_ip_stats.reponse_errors)", display:{id:'MIN(virtual_ip_stats.reponse_errors)', field:'MIN(virtual_ip_stats.reponse_errors)', width:180, name:"MIN (Reponse Errors)", groupable:false}},
            {select:"MAX(virtual_ip_stats.reponse_errors)", display:{id:'MAX(virtual_ip_stats.reponse_errors)', field:'MAX(virtual_ip_stats.reponse_errors)', width:180, name:"MAX (Reponse Errors)", groupable:false}},
        ],
        "StatTable.UveLoadbalancer.listener_stats": [
            {select:"COUNT(listener_stats)", display:{id:'COUNT(listener_stats)', field:'COUNT(listener_stats)', width:170, name:"Count (Listener Stats)", groupable:false}},
            {select:"listener_stats.obj_name", display:{id:'listener_stats.obj_name', field:'listener_stats.obj_name', width:150, name:"Object Name", groupable:false}},
            {select:"listener_stats.uuid", display:{id:"listener_stats.uuid", field:"listener_stats.uuid", name:"Listener Stats UUID",  width:280, groupable:true}},
            {select:"listener_stats.status", display:{id:"listener_stats.status", field:"listener_stats.status", name:"Status",  width:150, groupable:true}},
            {select:"listener_stats.vrouter", display:{id:"listener_stats.vrouter", field:"listener_stats.vrouter", name:"Vrouter",  width:150, groupable:true}},

            {select:"listener_stats.active_connections", display:{id:'listener_stats.active_connections', field:'listener_stats.active_connections', width:180, name:"Active Connections", groupable:false}},
            {select:"SUM(listener_stats.active_connections)", display:{id:'SUM(listener_stats.active_connections)', field:'SUM(listener_stats.active_connections)', width:180, name:"SUM (Active Connections)", groupable:false}},
            {select:"MIN(listener_stats.active_connections)", display:{id:'MIN(listener_stats.active_connections)', field:'MIN(listener_stats.active_connections)', width:180, name:"MIN (Active Connections)", groupable:false}},
            {select:"MAX(listener_stats.active_connections)", display:{id:'MAX(listener_stats.active_connections)', field:'MAX(listener_stats.active_connections)', width:180, name:"MAX (Active Connections)", groupable:false}},

            {select:"listener_stats.max_connections", display:{id:'listener_stats.max_connections', field:'listener_stats.max_connections', width:180, name:"Max Connections", groupable:false}},
            {select:"SUM(listener_stats.max_connections)", display:{id:'SUM(listener_stats.max_connections)', field:'SUM(listener_stats.max_connections)', width:180, name:"SUM (Max Connections)", groupable:false}},
            {select:"MIN(listener_stats.max_connections)", display:{id:'MIN(listener_stats.max_connections)', field:'MIN(listener_stats.max_connections)', width:180, name:"MIN (Max Connections)", groupable:false}},
            {select:"MAX(listener_stats.max_connections)", display:{id:'MAX(listener_stats.max_connections)', field:'MAX(listener_stats.max_connections)', width:180, name:"MAX (Max Connections)", groupable:false}},

            {select:"listener_stats.current_sessions", display:{id:'listener_stats.current_sessions', field:'listener_stats.current_sessions', width:180, name:"Current Sessions", groupable:false}},
            {select:"SUM(listener_stats.current_sessions)", display:{id:'SUM(listener_stats.current_sessions)', field:'SUM(listener_stats.current_sessions)', width:180, name:"SUM (Current Sessions)", groupable:false}},
            {select:"MIN(listener_stats.current_sessions)", display:{id:'MIN(listener_stats.current_sessions)', field:'MIN(listener_stats.current_sessions)', width:180, name:"MIN (Current Sessions)", groupable:false}},
            {select:"MAX(listener_stats.current_sessions)", display:{id:'MAX(listener_stats.current_sessions)', field:'MAX(listener_stats.current_sessions)', width:180, name:"MAX (Current Sessions)", groupable:false}},

            {select:"listener_stats.max_sessions", display:{id:'listener_stats.max_sessions', field:'listener_stats.max_sessions', width:180, name:"Max Sessions", groupable:false}},
            {select:"SUM(listener_stats.max_sessions)", display:{id:'SUM(listener_stats.max_sessions)', field:'SUM(listener_stats.max_sessions)', width:180, name:"SUM (Max Sessions)", groupable:false}},
            {select:"MIN(listener_stats.max_sessions)", display:{id:'MIN(listener_stats.max_sessions)', field:'MIN(listener_stats.max_sessions)', width:180, name:"MIN (Max Sessions)", groupable:false}},
            {select:"MAX(listener_stats.max_sessions)", display:{id:'MAX(listener_stats.max_sessions)', field:'MAX(listener_stats.max_sessions)', width:180, name:"MAX (Max Sessions)", groupable:false}},

            {select:"listener_stats.total_sessions", display:{id:'listener_stats.total_sessions', field:'listener_stats.total_sessions', width:180, name:"Total Sessions", groupable:false}},
            {select:"SUM(listener_stats.total_sessions)", display:{id:'SUM(listener_stats.total_sessions)', field:'SUM(listener_stats.total_sessions)', width:180, name:"SUM (Total Sessions)", groupable:false}},
            {select:"MIN(listener_stats.total_sessions)", display:{id:'MIN(listener_stats.total_sessions)', field:'MIN(listener_stats.total_sessions)', width:180, name:"MIN (Total Sessions)", groupable:false}},
            {select:"MAX(listener_stats.total_sessions)", display:{id:'MAX(listener_stats.total_sessions)', field:'MAX(listener_stats.total_sessions)', width:180, name:"MAX (Total Sessions)", groupable:false}},

            {select:"listener_stats.bytes_in", display:{id:'listener_stats.bytes_in', field:'listener_stats.bytes_in', width:150, name:"Bytes In", groupable:false}},
            {select:"SUM(listener_stats.bytes_in)", display:{id:'SUM(listener_stats.bytes_in)', field:'SUM(listener_stats.bytes_in)', width:150, name:"SUM (Bytes In)", groupable:false}},
            {select:"MIN(listener_stats.bytes_in)", display:{id:'MIN(listener_stats.bytes_in)', field:'MIN(listener_stats.bytes_in)', width:150, name:"MIN (Bytes In)", groupable:false}},
            {select:"MAX(listener_stats.bytes_in)", display:{id:'MAX(listener_stats.bytes_in)', field:'MAX(listener_stats.bytes_in)', width:150, name:"MAX (Bytes In)", groupable:false}},

            {select:"listener_stats.bytes_out", display:{id:'listener_stats.bytes_out', field:'listener_stats.bytes_out', width:150, name:"Bytes Out", groupable:false}},
            {select:"SUM(listener_stats.bytes_out)", display:{id:'SUM(listener_stats.bytes_out)', field:'SUM(listener_stats.bytes_out)', width:150, name:"SUM (Bytes Out)", groupable:false}},
            {select:"MIN(listener_stats.bytes_out)", display:{id:'MIN(listener_stats.bytes_out)', field:'MIN(listener_stats.bytes_out)', width:150, name:"MIN (Bytes Out)", groupable:false}},
            {select:"MAX(listener_stats.bytes_out)", display:{id:'MAX(listener_stats.bytes_out)', field:'MAX(listener_stats.bytes_out)', width:150, name:"MAX (Bytes Out)", groupable:false}},

            {select:"listener_stats.connection_errors", display:{id:'listener_stats.connection_errors', field:'listener_stats.connection_errors', width:180, name:"Connection Errors", groupable:false}},
            {select:"SUM(listener_stats.connection_errors)", display:{id:'SUM(listener_stats.connection_errors)', field:'SUM(listener_stats.connection_errors)', width:180, name:"SUM (Connection Errors)", groupable:false}},
            {select:"MIN(listener_stats.connection_errors)", display:{id:'MIN(listener_stats.connection_errors)', field:'MIN(listener_stats.connection_errors)', width:180, name:"MIN (Connection Errors)", groupable:false}},
            {select:"MAX(listener_stats.connection_errors)", display:{id:'MAX(listener_stats.connection_errors)', field:'MAX(listener_stats.connection_errors)', width:180, name:"MAX (Connection Errors)", groupable:false}},

            {select:"listener_stats.reponse_errors", display:{id:'listener_stats.reponse_errors', field:'listener_stats.reponse_errors', width:180, name:"Reponse Errors", groupable:false}},
            {select:"SUM(listener_stats.reponse_errors)", display:{id:'SUM(listener_stats.reponse_errors)', field:'SUM(listener_stats.reponse_errors)', width:180, name:"SUM (Reponse Errors)", groupable:false}},
            {select:"MIN(listener_stats.reponse_errors)", display:{id:'MIN(listener_stats.reponse_errors)', field:'MIN(listener_stats.reponse_errors)', width:180, name:"MIN (Reponse Errors)", groupable:false}},
            {select:"MAX(listener_stats.reponse_errors)", display:{id:'MAX(listener_stats.reponse_errors)', field:'MAX(listener_stats.reponse_errors)', width:180, name:"MAX (Reponse Errors)", groupable:false}},
        ],
        "StatTable.UveLoadbalancer.pool_stats" : [
            {select:"COUNT(pool_stats)", display:{id:'COUNT(pool_stats)', field:'COUNT(pool_stats)', width:150, name:"Count (Pool Stats)", groupable:false}},
            {select:"pool_stats.obj_name", display:{id:'pool_stats.obj_name', field:'pool_stats.obj_name', width:150, name:"Object Name", groupable:false}},
            {select:"pool_stats.uuid", display:{id:"pool_stats.uuid", field:"pool_stats.uuid", name:"Pool Stats UUID",  width:280, groupable:true}},
            {select:"pool_stats.status", display:{id:"pool_stats.status", field:"pool_stats.status", name:"Status",  width:150, groupable:true}},
            {select:"pool_stats.vrouter", display:{id:"pool_stats.vrouter", field:"pool_stats.vrouter", name:"Vrouter",  width:150, groupable:true}},

            {select:"pool_stats.active_connections", display:{id:'pool_stats.active_connections', field:'pool_stats.active_connections', width:180, name:"Active Connections", groupable:false}},
            {select:"SUM(pool_stats.active_connections)", display:{id:'SUM(pool_stats.active_connections)', field:'SUM(pool_stats.active_connections)', width:180, name:"SUM (Active Connections)", groupable:false}},
            {select:"MIN(pool_stats.active_connections)", display:{id:'MIN(pool_stats.active_connections)', field:'MIN(pool_stats.active_connections)', width:180, name:"MIN (Active Connections)", groupable:false}},
            {select:"MAX(pool_stats.active_connections)", display:{id:'MAX(pool_stats.active_connections)', field:'MAX(pool_stats.active_connections)', width:180, name:"MAX (Active Connections)", groupable:false}},

            {select:"pool_stats.max_connections", display:{id:'pool_stats.max_connections', field:'pool_stats.max_connections', width:180, name:"Max Connections", groupable:false}},
            {select:"SUM(pool_stats.max_connections)", display:{id:'SUM(pool_stats.max_connections)', field:'SUM(pool_stats.max_connections)', width:180, name:"SUM (Max Connections)", groupable:false}},
            {select:"MIN(pool_stats.max_connections)", display:{id:'MIN(pool_stats.max_connections)', field:'MIN(pool_stats.max_connections)', width:180, name:"MIN (Max Connections)", groupable:false}},
            {select:"MAX(pool_stats.max_connections)", display:{id:'MAX(pool_stats.max_connections)', field:'MAX(pool_stats.max_connections)', width:180, name:"MAX (Max Connections)", groupable:false}},

            {select:"pool_stats.current_sessions", display:{id:'pool_stats.current_sessions', field:'pool_stats.current_sessions', width:180, name:"Current Sessions", groupable:false}},
            {select:"SUM(pool_stats.current_sessions)", display:{id:'SUM(pool_stats.current_sessions)', field:'SUM(pool_stats.current_sessions)', width:180, name:"SUM (Current Sessions)", groupable:false}},
            {select:"MIN(pool_stats.current_sessions)", display:{id:'MIN(pool_stats.current_sessions)', field:'MIN(pool_stats.current_sessions)', width:180, name:"MIN (Current Sessions)", groupable:false}},
            {select:"MAX(pool_stats.current_sessions)", display:{id:'MAX(pool_stats.current_sessions)', field:'MAX(pool_stats.current_sessions)', width:180, name:"MAX (Current Sessions)", groupable:false}},

            {select:"pool_stats.max_sessions", display:{id:'pool_stats.max_sessions', field:'pool_stats.max_sessions', width:180, name:"Max Sessions", groupable:false}},
            {select:"SUM(pool_stats.max_sessions)", display:{id:'SUM(pool_stats.max_sessions)', field:'SUM(pool_stats.max_sessions)', width:180, name:"SUM (Max Sessions)", groupable:false}},
            {select:"MIN(pool_stats.max_sessions)", display:{id:'MIN(pool_stats.max_sessions)', field:'MIN(pool_stats.max_sessions)', width:180, name:"MIN (Max Sessions)", groupable:false}},
            {select:"MAX(pool_stats.max_sessions)", display:{id:'MAX(pool_stats.max_sessions)', field:'MAX(pool_stats.max_sessions)', width:180, name:"MAX (Max Sessions)", groupable:false}},

            {select:"pool_stats.total_sessions", display:{id:'pool_stats.total_sessions', field:'pool_stats.total_sessions', width:180, name:"Total Sessions", groupable:false}},
            {select:"SUM(pool_stats.total_sessions)", display:{id:'SUM(pool_stats.total_sessions)', field:'SUM(pool_stats.total_sessions)', width:180, name:"SUM (Total Sessions)", groupable:false}},
            {select:"MIN(pool_stats.total_sessions)", display:{id:'MIN(pool_stats.total_sessions)', field:'MIN(pool_stats.total_sessions)', width:180, name:"MIN (Total Sessions)", groupable:false}},
            {select:"MAX(pool_stats.total_sessions)", display:{id:'MAX(pool_stats.total_sessions)', field:'MAX(pool_stats.total_sessions)', width:180, name:"MAX (Total Sessions)", groupable:false}},

            {select:"pool_stats.bytes_in", display:{id:'pool_stats.bytes_in', field:'pool_stats.bytes_in', width:150, name:"Bytes In", groupable:false}},
            {select:"SUM(pool_stats.bytes_in)", display:{id:'SUM(pool_stats.bytes_in)', field:'SUM(pool_stats.bytes_in)', width:150, name:"SUM (Bytes In)", groupable:false}},
            {select:"MIN(pool_stats.bytes_in)", display:{id:'MIN(pool_stats.bytes_in)', field:'MIN(pool_stats.bytes_in)', width:150, name:"MIN (Bytes In)", groupable:false}},
            {select:"MAX(pool_stats.bytes_in)", display:{id:'MAX(pool_stats.bytes_in)', field:'MAX(pool_stats.bytes_in)', width:150, name:"MAX (Bytes In)", groupable:false}},

            {select:"pool_stats.bytes_out", display:{id:'pool_stats.bytes_out', field:'pool_stats.bytes_out', width:150, name:"Bytes Out", groupable:false}},
            {select:"SUM(pool_stats.bytes_out)", display:{id:'SUM(pool_stats.bytes_out)', field:'SUM(pool_stats.bytes_out)', width:150, name:"SUM (Bytes Out)", groupable:false}},
            {select:"MIN(pool_stats.bytes_out)", display:{id:'MIN(pool_stats.bytes_out)', field:'MIN(pool_stats.bytes_out)', width:150, name:"MIN (Bytes Out)", groupable:false}},
            {select:"MAX(pool_stats.bytes_out)", display:{id:'MAX(pool_stats.bytes_out)', field:'MAX(pool_stats.bytes_out)', width:150, name:"MAX (Bytes Out)", groupable:false}},

            {select:"pool_stats.connection_errors", display:{id:'pool_stats.connection_errors', field:'pool_stats.connection_errors', width:180, name:"Connection Errors", groupable:false}},
            {select:"SUM(pool_stats.connection_errors)", display:{id:'SUM(pool_stats.connection_errors)', field:'SUM(pool_stats.connection_errors)', width:180, name:"SUM (Connection Errors)", groupable:false}},
            {select:"MIN(pool_stats.connection_errors)", display:{id:'MIN(pool_stats.connection_errors)', field:'MIN(pool_stats.connection_errors)', width:180, name:"MIN (Connection Errors)", groupable:false}},
            {select:"MAX(pool_stats.connection_errors)", display:{id:'MAX(pool_stats.connection_errors)', field:'MAX(pool_stats.connection_errors)', width:180, name:"MAX (Connection Errors)", groupable:false}},

            {select:"pool_stats.reponse_errors", display:{id:'pool_stats.reponse_errors', field:'pool_stats.reponse_errors', width:180, name:"Reponse Errors", groupable:false}},
            {select:"SUM(pool_stats.reponse_errors)", display:{id:'SUM(pool_stats.reponse_errors)', field:'SUM(pool_stats.reponse_errors)', width:180, name:"SUM (Reponse Errors)", groupable:false}},
            {select:"MIN(pool_stats.reponse_errors)", display:{id:'MIN(pool_stats.reponse_errors)', field:'MIN(pool_stats.reponse_errors)', width:180, name:"MIN (Reponse Errors)", groupable:false}},
            {select:"MAX(pool_stats.reponse_errors)", display:{id:'MAX(pool_stats.reponse_errors)', field:'MAX(pool_stats.reponse_errors)', width:180, name:"MAX (Reponse Errors)", groupable:false}},
        ],
        "StatTable.UveLoadbalancer.member_stats": [
            {select:"COUNT(member_stats)", display:{id:'COUNT(member_stats)', field:'COUNT(member_stats)', width:170, name:"Count (Member Stats)", groupable:false}},
            {select:"member_stats.obj_name", display:{id:'member_stats.obj_name', field:'member_stats.obj_name', width:150, name:"Object Name", groupable:false}},
            {select:"member_stats.uuid", display:{id:"member_stats.uuid", field:"member_stats.uuid", name:"Pool Stats UUID",  width:280, groupable:true}},
            {select:"member_stats.status", display:{id:"member_stats.status", field:"member_stats.status", name:"Status",  width:150, groupable:true}},
            {select:"member_stats.vrouter", display:{id:"member_stats.vrouter", field:"member_stats.vrouter", name:"Vrouter",  width:150, groupable:true}},

            {select:"member_stats.active_connections", display:{id:'member_stats.active_connections', field:'member_stats.active_connections', width:180, name:"Active Connections", groupable:false}},
            {select:"SUM(member_stats.active_connections)", display:{id:'SUM(member_stats.active_connections)', field:'SUM(member_stats.active_connections)', width:180, name:"SUM (Active Connections)", groupable:false}},
            {select:"MIN(member_stats.active_connections)", display:{id:'MIN(member_stats.active_connections)', field:'MIN(member_stats.active_connections)', width:180, name:"MIN (Active Connections)", groupable:false}},
            {select:"MAX(member_stats.active_connections)", display:{id:'MAX(member_stats.active_connections)', field:'MAX(member_stats.active_connections)', width:180, name:"MAX (Active Connections)", groupable:false}},

            {select:"member_stats.max_connections", display:{id:'member_stats.max_connections', field:'member_stats.max_connections', width:180, name:"Max Connections", groupable:false}},
            {select:"SUM(member_stats.max_connections)", display:{id:'SUM(member_stats.max_connections)', field:'SUM(member_stats.max_connections)', width:180, name:"SUM (Max Connections)", groupable:false}},
            {select:"MIN(member_stats.max_connections)", display:{id:'MIN(member_stats.max_connections)', field:'MIN(member_stats.max_connections)', width:180, name:"MIN (Max Connections)", groupable:false}},
            {select:"MAX(member_stats.max_connections)", display:{id:'MAX(member_stats.max_connections)', field:'MAX(member_stats.max_connections)', width:180, name:"MAX (Max Connections)", groupable:false}},

            {select:"member_stats.current_sessions", display:{id:'member_stats.current_sessions', field:'member_stats.current_sessions', width:180, name:"Current Sessions", groupable:false}},
            {select:"SUM(member_stats.current_sessions)", display:{id:'SUM(member_stats.current_sessions)', field:'SUM(member_stats.current_sessions)', width:180, name:"SUM (Current Sessions)", groupable:false}},
            {select:"MIN(member_stats.current_sessions)", display:{id:'MIN(member_stats.current_sessions)', field:'MIN(member_stats.current_sessions)', width:180, name:"MIN (Current Sessions)", groupable:false}},
            {select:"MAX(member_stats.current_sessions)", display:{id:'MAX(member_stats.current_sessions)', field:'MAX(member_stats.current_sessions)', width:180, name:"MAX (Current Sessions)", groupable:false}},

            {select:"member_stats.max_sessions", display:{id:'member_stats.max_sessions', field:'member_stats.max_sessions', width:180, name:"Max Sessions", groupable:false}},
            {select:"SUM(member_stats.max_sessions)", display:{id:'SUM(member_stats.max_sessions)', field:'SUM(member_stats.max_sessions)', width:180, name:"SUM (Max Sessions)", groupable:false}},
            {select:"MIN(member_stats.max_sessions)", display:{id:'MIN(member_stats.max_sessions)', field:'MIN(member_stats.max_sessions)', width:180, name:"MIN (Max Sessions)", groupable:false}},
            {select:"MAX(member_stats.max_sessions)", display:{id:'MAX(member_stats.max_sessions)', field:'MAX(member_stats.max_sessions)', width:180, name:"MAX (Max Sessions)", groupable:false}},

            {select:"member_stats.total_sessions", display:{id:'member_stats.total_sessions', field:'member_stats.total_sessions', width:180, name:"Total Sessions", groupable:false}},
            {select:"SUM(member_stats.total_sessions)", display:{id:'SUM(member_stats.total_sessions)', field:'SUM(member_stats.total_sessions)', width:180, name:"SUM (Total Sessions)", groupable:false}},
            {select:"MIN(member_stats.total_sessions)", display:{id:'MIN(member_stats.total_sessions)', field:'MIN(member_stats.total_sessions)', width:180, name:"MIN (Total Sessions)", groupable:false}},
            {select:"MAX(member_stats.total_sessions)", display:{id:'MAX(member_stats.total_sessions)', field:'MAX(member_stats.total_sessions)', width:180, name:"MAX (Total Sessions)", groupable:false}},

            {select:"member_stats.bytes_in", display:{id:'member_stats.bytes_in', field:'member_stats.bytes_in', width:150, name:"Bytes In", groupable:false}},
            {select:"SUM(member_stats.bytes_in)", display:{id:'SUM(member_stats.bytes_in)', field:'SUM(member_stats.bytes_in)', width:150, name:"SUM (Bytes In)", groupable:false}},
            {select:"MIN(member_stats.bytes_in)", display:{id:'MIN(member_stats.bytes_in)', field:'MIN(member_stats.bytes_in)', width:150, name:"MIN (Bytes In)", groupable:false}},
            {select:"MAX(member_stats.bytes_in)", display:{id:'MAX(member_stats.bytes_in)', field:'MAX(member_stats.bytes_in)', width:150, name:"MAX (Bytes In)", groupable:false}},

            {select:"member_stats.bytes_out", display:{id:'member_stats.bytes_out', field:'member_stats.bytes_out', width:150, name:"Bytes Out", groupable:false}},
            {select:"SUM(member_stats.bytes_out)", display:{id:'SUM(member_stats.bytes_out)', field:'SUM(member_stats.bytes_out)', width:150, name:"SUM (Bytes Out)", groupable:false}},
            {select:"MIN(member_stats.bytes_out)", display:{id:'MIN(member_stats.bytes_out)', field:'MIN(member_stats.bytes_out)', width:150, name:"MIN (Bytes Out)", groupable:false}},
            {select:"MAX(member_stats.bytes_out)", display:{id:'MAX(member_stats.bytes_out)', field:'MAX(member_stats.bytes_out)', width:150, name:"MAX (Bytes Out)", groupable:false}},

            {select:"member_stats.connection_errors", display:{id:'member_stats.connection_errors', field:'member_stats.connection_errors', width:180, name:"Connection Errors", groupable:false}},
            {select:"SUM(member_stats.connection_errors)", display:{id:'SUM(member_stats.connection_errors)', field:'SUM(member_stats.connection_errors)', width:180, name:"SUM (Connection Errors)", groupable:false}},
            {select:"MIN(member_stats.connection_errors)", display:{id:'MIN(member_stats.connection_errors)', field:'MIN(member_stats.connection_errors)', width:180, name:"MIN (Connection Errors)", groupable:false}},
            {select:"MAX(member_stats.connection_errors)", display:{id:'MAX(member_stats.connection_errors)', field:'MAX(member_stats.connection_errors)', width:180, name:"MAX (Connection Errors)", groupable:false}},

            {select:"member_stats.reponse_errors", display:{id:'member_stats.reponse_errors', field:'member_stats.reponse_errors', width:180, name:"Reponse Errors", groupable:false}},
            {select:"SUM(member_stats.reponse_errors)", display:{id:'SUM(member_stats.reponse_errors)', field:'SUM(member_stats.reponse_errors)', width:180, name:"SUM (Reponse Errors)", groupable:false}},
            {select:"MIN(member_stats.reponse_errors)", display:{id:'MIN(member_stats.reponse_errors)', field:'MIN(member_stats.reponse_errors)', width:180, name:"MIN (Reponse Errors)", groupable:false}},
            {select:"MAX(member_stats.reponse_errors)", display:{id:'MAX(member_stats.reponse_errors)', field:'MAX(member_stats.reponse_errors)', width:180, name:"MAX (Reponse Errors)", groupable:false}},
        ],
        "StatTable.NodeStatus.disk_usage_info": [
            {select:"COUNT(disk_usage_info)", display:{id:'COUNT(disk_usage_info)', field:'COUNT(disk_usage_info)', width:180, name:"Count (Disk Usage Info)", groupable:false}},
            {select:"disk_usage_info.partition_type", display:{id:'disk_usage_info.partition_type', field:'disk_usage_info.partition_type', width:150, name:"Partition Type", groupable:false}},
            {select:"disk_usage_info.partition_name", display:{id:'disk_usage_info.partition_name', field:'disk_usage_info.partition_name', width:150, name:"Partition Name", groupable:false}},

            {select:"disk_usage_info.partition_space_used_1k", display:{id:'disk_usage_info.partition_space_used_1k', field:'disk_usage_info.partition_space_used_1k', width:200, name:"Partition Space Used (1k)", groupable:false}},
            {select:"SUM(disk_usage_info.partition_space_used_1k)", display:{id:'SUM(disk_usage_info.partition_space_used_1k)', field:'SUM(disk_usage_info.partition_space_used_1k)', width:240, name:"SUM (Partition Space Used (1k))", groupable:false}},
            {select:"MIN(disk_usage_info.partition_space_used_1k)", display:{id:'MIN(disk_usage_info.partition_space_used_1k)', field:'MIN(disk_usage_info.partition_space_used_1k)', width:240, name:"MIN (Partition Space Used (1k))", groupable:false}},
            {select:"MAX(disk_usage_info.partition_space_used_1k)", display:{id:'MAX(disk_usage_info.partition_space_used_1k)', field:'MAX(disk_usage_info.partition_space_used_1k)', width:240, name:"MAX (Partition Space Used (1k))", groupable:false}},

            {select:"disk_usage_info.partition_space_available_1k", display:{id:'disk_usage_info.partition_space_available_1k', field:'disk_usage_info.partition_space_available_1k', width:260, name:"Partition Space Available (1k)", groupable:false}},
            {select:"SUM(disk_usage_info.partition_space_available_1k)", display:{id:'SUM(disk_usage_info.partition_space_available_1k)', field:'SUM(disk_usage_info.partition_space_available_1k)', width:260, name:"SUM (Partition Space Available (1k))", groupable:false}},
            {select:"MIN(disk_usage_info.partition_space_available_1k)", display:{id:'MIN(disk_usage_info.partition_space_available_1k)', field:'MIN(disk_usage_info.partition_space_available_1k)', width:260, name:"MIN (Partition Space Available (1k))", groupable:false}},
            {select:"MAX(disk_usage_info.partition_space_available_1k)", display:{id:'MAX(disk_usage_info.partition_space_available_1k)', field:'MAX(disk_usage_info.partition_space_available_1k)', width:260, name:"MAX (Partition Space Available (1k))", groupable:false}},
        ],
        "StatTable.UveVMInterfaceAgent.fip_diff_stats": [
            {select:"COUNT(fip_diff_stats)", display:{id:'COUNT(fip_diff_stats)', field:'COUNT(fip_diff_stats)', width:150, name:"Count (FIP Diff Stats)", groupable:false}},
            {select:"virtual_network", display:{id:'virtual_network', field:'virtual_network', width:150, name:"Virtual Network", groupable:false}},
            {select:"fip_diff_stats.other_vn", display:{id:'fip_diff_stats.other_vn', field:'fip_diff_stats.other_vn', width:150, name:"Other VN", groupable:false}},
            {select:"fip_diff_stats.ip_address", display:{id:'fip_diff_stats.ip_address', field:'fip_diff_stats.ip_address', width:150, name:"IP Address", groupable:false}},

            {select:"fip_diff_stats.in_pkts", display:{id:'fip_diff_stats.in_pkts', field:'fip_diff_stats.in_pkts', width:150, name:"In Pkts", groupable:false}},
            {select:"SUM(fip_diff_stats.in_pkts)", display:{id:'SUM(fip_diff_stats.in_pkts)', field:'SUM(fip_diff_stats.in_pkts)', width:150, name:"SUM (In Pkts)", groupable:false}},
            {select:"MIN(fip_diff_stats.in_pkts)", display:{id:'MIN(fip_diff_stats.in_pkts)', field:'MIN(fip_diff_stats.in_pkts)', width:150, name:"MIN (In Pkts)", groupable:false}},
            {select:"MAX(fip_diff_stats.in_pkts)", display:{id:'MAX(fip_diff_stats.in_pkts)', field:'MAX(fip_diff_stats.in_pkts)', width:150, name:"MAX (In Pkts)", groupable:false}},

            {select:"fip_diff_stats.in_pkts", display:{id:'fip_diff_stats.in_bytes', field:'fip_diff_stats.in_bytes', width:150, name:"In Bytes", groupable:false}},
            {select:"SUM(fip_diff_stats.in_bytes)", display:{id:'SUM(fip_diff_stats.in_bytes)', field:'SUM(fip_diff_stats.in_bytes)', width:150, name:"SUM (In Bytes)", groupable:false}},
            {select:"MIN(fip_diff_stats.in_bytes)", display:{id:'MIN(fip_diff_stats.in_bytes)', field:'MIN(fip_diff_stats.in_bytes)', width:150, name:"MIN (In Bytes)", groupable:false}},
            {select:"MAX(fip_diff_stats.in_bytes)", display:{id:'MAX(fip_diff_stats.in_bytes)', field:'MAX(fip_diff_stats.in_bytes)', width:150, name:"MAX (In Bytes)", groupable:false}},

            {select:"fip_diff_stats.out_pkts", display:{id:'fip_diff_stats.out_pkts', field:'fip_diff_stats.out_pkts', width:150, name:"Out Pkts", groupable:false}},
            {select:"SUM(fip_diff_stats.out_pkts)", display:{id:'SUM(fip_diff_stats.out_pkts)', field:'SUM(fip_diff_stats.out_pkts)', width:150, name:"SUM (Out Pkts)", groupable:false}},
            {select:"MIN(fip_diff_stats.out_pkts)", display:{id:'MIN(fip_diff_stats.out_pkts)', field:'MIN(fip_diff_stats.out_pkts)', width:150, name:"MIN (Out Pkts)", groupable:false}},
            {select:"MAX(fip_diff_stats.out_pkts)", display:{id:'MAX(fip_diff_stats.out_pkts)', field:'MAX(fip_diff_stats.out_pkts)', width:150, name:"MAX (Out Pkts)", groupable:false}},

            {select:"fip_diff_stats.out_bytes", display:{id:'fip_diff_stats.out_bytes', field:'fip_diff_stats.out_bytes', width:150, name:"Out Bytes", groupable:false}},
            {select:"SUM(fip_diff_stats.out_bytes)", display:{id:'SUM(fip_diff_stats.out_bytes)', field:'SUM(fip_diff_stats.out_bytes)', width:150, name:"SUM (Out Bytes)", groupable:false}},
            {select:"MIN(fip_diff_stats.out_bytes)", display:{id:'MIN(fip_diff_stats.out_bytes)', field:'MIN(fip_diff_stats.out_bytes)', width:150, name:"MIN (Out Bytes)", groupable:false}},
            {select:"MAX(fip_diff_stats.out_bytes)", display:{id:'MAX(fip_diff_stats.out_bytes)', field:'MAX(fip_diff_stats.out_bytes)', width:150, name:"MAX (Out Bytes)", groupable:false}},
        ],
        "StatTable.UveVMInterfaceAgent.if_stats" : [
            {select:"COUNT(if_stats)", display:{id:'COUNT(if_stats)', field:'COUNT(if_stats)', width:180, name:"Count (Interface Stats)", groupable:false}},
            {select:"virtual_network", display:{id:'virtual_network', field:'virtual_network', width:150, name:"Virtual Network", groupable:false}},
            {select:"if_stats.other_vn", display:{id:'if_stats.other_vn', field:'if_stats.other_vn', width:150, name:"Other VN", groupable:false}},
            {select:"if_stats.ip_address", display:{id:'if_stats.ip_address', field:'if_stats.ip_address', width:150, name:"IP Address", groupable:false}},

            {select:"if_stats.in_pkts", display:{id:'if_stats.in_pkts', field:'if_stats.in_pkts', width:150, name:"In Pkts", groupable:false}},
            {select:"SUM(if_stats.in_pkts)", display:{id:'SUM(if_stats.in_pkts)', field:'SUM(if_stats.in_pkts)', width:150, name:"SUM (In Pkts)", groupable:false}},
            {select:"MIN(if_stats.in_pkts)", display:{id:'MIN(if_stats.in_pkts)', field:'MIN(if_stats.in_pkts)', width:150, name:"MIN (In Pkts)", groupable:false}},
            {select:"MAX(if_stats.in_pkts)", display:{id:'MAX(if_stats.in_pkts)', field:'MAX(if_stats.in_pkts)', width:150, name:"MAX (In Pkts)", groupable:false}},

            {select:"if_stats.in_pkts", display:{id:'if_stats.in_bytes', field:'if_stats.in_bytes', width:150, name:"In Bytes", groupable:false}},
            {select:"SUM(if_stats.in_bytes)", display:{id:'SUM(if_stats.in_bytes)', field:'SUM(if_stats.in_bytes)', width:150, name:"SUM (In Bytes)", groupable:false}},
            {select:"MIN(if_stats.in_bytes)", display:{id:'MIN(if_stats.in_bytes)', field:'MIN(if_stats.in_bytes)', width:150, name:"MIN (In Bytes)", groupable:false}},
            {select:"MAX(if_stats.in_bytes)", display:{id:'MAX(if_stats.in_bytes)', field:'MAX(if_stats.in_bytes)', width:150, name:"MAX (In Bytes)", groupable:false}},

            {select:"if_stats.out_pkts", display:{id:'if_stats.out_pkts', field:'if_stats.out_pkts', width:150, name:"Out Pkts", groupable:false}},
            {select:"SUM(if_stats.out_pkts)", display:{id:'SUM(if_stats.out_pkts)', field:'SUM(if_stats.out_pkts)', width:150, name:"SUM (Out Pkts)", groupable:false}},
            {select:"MIN(if_stats.out_pkts)", display:{id:'MIN(if_stats.out_pkts)', field:'MIN(if_stats.out_pkts)', width:150, name:"MIN (Out Pkts)", groupable:false}},
            {select:"MAX(if_stats.out_pkts)", display:{id:'MAX(if_stats.out_pkts)', field:'MAX(if_stats.out_pkts)', width:150, name:"MAX (Out Pkts)", groupable:false}},

            {select:"if_stats.out_bytes", display:{id:'if_stats.out_bytes', field:'if_stats.out_bytes', width:150, name:"Out Bytes", groupable:false}},
            {select:"SUM(if_stats.out_bytes)", display:{id:'SUM(if_stats.out_bytes)', field:'SUM(if_stats.out_bytes)', width:150, name:"SUM (Out Bytes)", groupable:false}},
            {select:"MIN(if_stats.out_bytes)", display:{id:'MIN(if_stats.out_bytes)', field:'MIN(if_stats.out_bytes)', width:150, name:"MIN (Out Bytes)", groupable:false}},
            {select:"MAX(if_stats.out_bytes)", display:{id:'MAX(if_stats.out_bytes)', field:'MAX(if_stats.out_bytes)', width:150, name:"MAX (Out Bytes)", groupable:false}},

            {select:"vm_name", display:{id:'vm_name', field:'vm_name', width:150, name:"VM Name", groupable:false}},
            {select:"vm_uuid", display:{id:'vm_uuid', field:'vm_uuid', width:150, name:"VM uuid", groupable:false}},

            {select:"if_stats.in_bw_usage", display:{id:'if_stats.in_bw_usage', field:'if_stats.in_bw_usage', width:180, name:"In BW Usage", groupable:false}},
            {select:"SUM(if_stats.in_bw_usage)", display:{id:'SUM(if_stats.in_bw_usage)', field:'SUM(if_stats.in_bw_usage)', width:180, name:"SUM (In BW Usage)", groupable:false}},
            {select:"MIN(if_stats.in_bw_usage)", display:{id:'MIN(if_stats.in_bw_usage)', field:'MIN(if_stats.in_bw_usage)', width:180, name:"MIN (In BW Usage)", groupable:false}},
            {select:"MAX(if_stats.in_bw_usage)", display:{id:'MAX(if_stats.in_bw_usage)', field:'MAX(if_stats.in_bw_usage)', width:180, name:"MAX (In BW Usage)", groupable:false}},

            {select:"if_stats.out_bw_usage", display:{id:'if_stats.out_bw_usage', field:'if_stats.out_bw_usage', width:180, name:"Out BW Usage", groupable:false}},
            {select:"SUM(if_stats.out_bw_usage)", display:{id:'SUM(if_stats.out_bw_usage)', field:'SUM(if_stats.out_bw_usage)', width:180, name:"SUM (Out BW Usage)", groupable:false}},
            {select:"MIN(if_stats.out_bw_usage)", display:{id:'MIN(if_stats.out_bw_usage)', field:'MIN(if_stats.out_bw_usage)', width:180, name:"MIN (Out BW Usage)", groupable:false}},
            {select:"MAX(if_stats.out_bw_usage)", display:{id:'MAX(if_stats.out_bw_usage)', field:'MAX(if_stats.out_bw_usage)', width:180, name:"MAX (Out BW Usage)", groupable:false}}
        ],

        "StatTable.VrouterStatsAgent.flow_rate" : [
            {select:"COUNT(flow_rate)", display:{id:'COUNT(flow_rate)', field:'COUNT(flow_rate)', width:150, name:"Count (Flow Rate)", groupable:false}},

            {select:"flow_rate.added_flows", display:{id:'flow_rate.added_flows', field:'flow_rate.added_flows', width:170, name:"Added Flows", groupable:false}},
            {select:"SUM(flow_rate.added_flows)", display:{id:'SUM(flow_rate.added_flows)', field:'SUM(flow_rate.added_flows)', width:170, name:"SUM (Added Flows)", groupable:false}},
            {select:"MIN(flow_rate.added_flows)", display:{id:'MIN(flow_rate.added_flows)', field:'MIN(flow_rate.added_flows)', width:170, name:"MIN (Added Flows)", groupable:false}},
            {select:"MAX(flow_rate.added_flows)", display:{id:'MAX(flow_rate.added_flows)', field:'MAX(flow_rate.added_flows)', width:170, name:"MAX (Added Flows)", groupable:false}},

            {select:"flow_rate.deleted_flows", display:{id:'flow_rate.deleted_flows', field:'flow_rate.deleted_flows', width:170, name:"Deleted Flows", groupable:false}},
            {select:"SUM(flow_rate.deleted_flows)", display:{id:'SUM(flow_rate.deleted_flows)', field:'SUM(flow_rate.deleted_flows)', width:170, name:"SUM (Deleted Flows)", groupable:false}},
            {select:"MIN(flow_rate.deleted_flows)", display:{id:'MIN(flow_rate.deleted_flows)', field:'MIN(flow_rate.deleted_flows)', width:170, name:"MIN (Deleted Flows)", groupable:false}},
            {select:"MAX(flow_rate.deleted_flows)", display:{id:'MAX(flow_rate.deleted_flows)', field:'MAX(flow_rate.deleted_flows)', width:170, name:"MAX (Deleted Flows)", groupable:false}},

            {select:"flow_rate.max_flow_adds_per_second", display:{id:'flow_rate.max_flow_adds_per_second', field:'flow_rate.max_flow_adds_per_second', width:200, name:"Max Flow Adds Per Sec", groupable:false}},
            {select:"SUM(flow_rate.max_flow_adds_per_second)", display:{id:'SUM(flow_rate.max_flow_adds_per_second)', field:'SUM(flow_rate.max_flow_adds_per_second)', width:220, name:"SUM (Max Flow Adds Per Sec)", groupable:false}},
            {select:"MIN(flow_rate.max_flow_adds_per_second)", display:{id:'MIN(flow_rate.max_flow_adds_per_second)', field:'MIN(flow_rate.max_flow_adds_per_second)', width:220, name:"MIN (Max Flow Adds Per Sec)", groupable:false}},
            {select:"MAX(flow_rate.max_flow_adds_per_second)", display:{id:'MAX(flow_rate.max_flow_adds_per_second)', field:'MAX(flow_rate.max_flow_adds_per_second)', width:220, name:"MAX (Max Flow Adds Per Sec)", groupable:false}},

            {select:"flow_rate.min_flow_adds_per_second", display:{id:'flow_rate.min_flow_adds_per_second', field:'flow_rate.min_flow_adds_per_second', width:200, name:"Min Flow Adds Per Sec", groupable:false}},
            {select:"SUM(flow_rate.min_flow_adds_per_second)", display:{id:'SUM(flow_rate.min_flow_adds_per_second)', field:'SUM(flow_rate.min_flow_adds_per_second)', width:220, name:"SUM (Min Flow Adds Per Sec)", groupable:false}},
            {select:"MIN(flow_rate.min_flow_adds_per_second)", display:{id:'MIN(flow_rate.min_flow_adds_per_second)', field:'MIN(flow_rate.min_flow_adds_per_second)', width:220, name:"MIN (Min Flow Adds Per Sec)", groupable:false}},
            {select:"MAX(flow_rate.min_flow_adds_per_second)", display:{id:'MAX(flow_rate.min_flow_adds_per_second)', field:'MAX(flow_rate.min_flow_adds_per_second)', width:220, name:"MAX (Min Flow Adds Per Sec)", groupable:false}},

            {select:"flow_rate.max_flow_deletes_per_second", display:{id:'flow_rate.max_flow_deletes_per_second', field:'flow_rate.max_flow_deletes_per_second', width:200, name:"Max Flow Dels Per Sec", groupable:false}},
            {select:"SUM(flow_rate.max_flow_deletes_per_second)", display:{id:'SUM(flow_rate.max_flow_deletes_per_second)', field:'SUM(flow_rate.max_flow_deletes_per_second)', width:220, name:"SUM (Max Flow Dels Per Sec)", groupable:false}},
            {select:"MIN(flow_rate.max_flow_deletes_per_second)", display:{id:'MIN(flow_rate.max_flow_deletes_per_second)', field:'MIN(flow_rate.max_flow_deletes_per_second)', width:220, name:"MIN (Max Flow Dels Per Sec)", groupable:false}},
            {select:"MAX(flow_rate.max_flow_deletes_per_second)", display:{id:'MAX(flow_rate.max_flow_deletes_per_second)', field:'MAX(flow_rate.max_flow_deletes_per_second)', width:220, name:"MAX (Max Flow Dels Per Sec)", groupable:false}},

            {select:"flow_rate.min_flow_deletes_per_second", display:{id:'flow_rate.min_flow_deletes_per_second', field:'flow_rate.min_flow_deletes_per_second', width:200, name:"Min Flow Dels Per Sec", groupable:false}},
            {select:"SUM(flow_rate.min_flow_deletes_per_second)", display:{id:'SUM(flow_rate.min_flow_deletes_per_second)', field:'SUM(flow_rate.min_flow_deletes_per_second)', width:220, name:"SUM (Min Flow Dels Per Sec)", groupable:false}},
            {select:"MIN(flow_rate.min_flow_deletes_per_second)", display:{id:'MIN(flow_rate.min_flow_deletes_per_second)', field:'MIN(flow_rate.min_flow_deletes_per_second)', width:220, name:"MIN (Min Flow Dels Per Sec)", groupable:false}},
            {select:"MAX(flow_rate.min_flow_deletes_per_second)", display:{id:'MAX(flow_rate.min_flow_deletes_per_second)', field:'MAX(flow_rate.min_flow_deletes_per_second)', width:220, name:"MAX (Min Flow Dels Per Sec)", groupable:false}},
        ],

        "StatTable.AnalyticsApiStats.api_stats" : [
            {select:"COUNT(api_stats)", display:{id:'COUNT(api_stats)', field:'COUNT(api_stats)', width:150, name:"Count (Api Stats)", groupable:false}},
            {select:"api_stats.operation_type", display:{id:'api_stats.operation_type', field:'api_stats.operation_type', width:150, name:"Operation Type", groupable:false}},
            {select:"api_stats.remote_ip", display:{id:'api_stats.remote_ip', field:'api_stats.remote_ip', width:100, name:"Remote IP", groupable:false}},
            {select:"api_stats.object_type", display:{id:'api_stats.object_type', field:'api_stats.object_type', width:100, name:"Object Type", groupable:false}},
            {select:"api_stats.request_url", display:{id:'api_stats.request_url', field:'api_stats.request_url', width:100, name:"Request Url", groupable:false}},
            {select:"api_stats.node", display:{id:'api_stats.node', field:'api_stats.node', width:100, name:"Node", groupable:false}},

            {select:"api_stats.response_time_in_usec", display:{id:'api_stats.response_time_in_usec', field:'api_stats.response_time_in_usec', width:200, name:"Response Time in usec", groupable:false}},
            {select:"SUM(api_stats.response_time_in_usec)", display:{id:'SUM(api_stats.response_time_in_usec)', field:'SUM(api_stats.response_time_in_usec)', width:220, name:"SUM (Response Time in usec)", groupable:false}},
            {select:"MIN(api_stats.response_time_in_usec)", display:{id:'MIN(api_stats.response_time_in_usec)', field:'MIN(api_stats.response_time_in_usec)', width:220, name:"MIN (Response Time in usec)", groupable:false}},
            {select:"MAX(api_stats.response_time_in_usec)", display:{id:'MAX(api_stats.response_time_in_usec)', field:'MAX(api_stats.response_time_in_usec)', width:220, name:"MAX (Response Time in usec)", groupable:false}},

            {select:"api_stats.response_size", display:{id:'api_stats.response_size', field:'api_stats.response_size', width:200, name:"Response Time in usec", groupable:false}},
            {select:"SUM(api_stats.response_size)", display:{id:'SUM(api_stats.response_size)', field:'SUM(api_stats.response_size)', width:220, name:"SUM (Response Size)", groupable:false}},
            {select:"MIN(api_stats.response_size)", display:{id:'MIN(api_stats.response_size)', field:'MIN(api_stats.response_size)', width:220, name:"MIN (Response Size)", groupable:false}},
            {select:"MAX(api_stats.response_size)", display:{id:'MAX(api_stats.response_size)', field:'MAX(api_stats.response_size)', width:220, name:"MAX (Response Size)", groupable:false}}
        ],

        "StatTable.VncApiStatsLog.api_stats" : [
            {select:"COUNT(api_stats)", display:{id:'COUNT(api_stats)', field:'COUNT(api_stats)', width:150, name:"Count (Api Stats)", groupable:false}},
            {select:"api_stats.operation_type", display:{id:'api_stats.operation_type', field:'api_stats.operation_type', width:150, name:"Operation Type", groupable:false}},
            {select:"api_stats.user", display:{id:'api_stats.user', field:'api_stats.user', width:100, name:"User", groupable:false}},
            {select:"api_stats.useragent", display:{id:'api_stats.useragent', field:'api_stats.useragent', width:100, name:"Useragent", groupable:false}},
            {select:"api_stats.remote_ip", display:{id:'api_stats.remote_ip', field:'api_stats.remote_ip', width:100, name:"Remote IP", groupable:false}},
            {select:"api_stats.domain_name", display:{id:'api_stats.domain_name', field:'api_stats.domain_name', width:120, name:"Domain Name", groupable:false}},
            {select:"api_stats.project_name", display:{id:'api_stats.project_name', field:'api_stats.project_name', width:100, name:"Project Name", groupable:false}},
            {select:"api_stats.object_type", display:{id:'api_stats.object_type', field:'api_stats.object_type', width:100, name:"Object Type", groupable:false}},

            {select:"api_stats.response_time_in_usec", display:{id:'api_stats.response_time_in_usec', field:'api_stats.response_time_in_usec', width:200, name:"Response Time in usec", groupable:false}},
            {select:"SUM(api_stats.response_time_in_usec)", display:{id:'SUM(api_stats.response_time_in_usec)', field:'SUM(api_stats.response_time_in_usec)', width:220, name:"SUM (Response Time in usec)", groupable:false}},
            {select:"MIN(api_stats.response_time_in_usec)", display:{id:'MIN(api_stats.response_time_in_usec)', field:'MIN(api_stats.response_time_in_usec)', width:220, name:"MIN (Response Time in usec)", groupable:false}},
            {select:"MAX(api_stats.response_time_in_usec)", display:{id:'MAX(api_stats.response_time_in_usec)', field:'MAX(api_stats.response_time_in_usec)', width:220, name:"MAX (Response Time in usec)", groupable:false}},

            {select:"api_stats.response_size", display:{id:'api_stats.response_size', field:'api_stats.response_size', width:200, name:"Response Size", groupable:false}},
            {select:"SUM(api_stats.response_size)", display:{id:'SUM(api_stats.response_size)', field:'SUM(api_stats.response_size)', width:220, name:"SUM (Response Size)", groupable:false}},
            {select:"MIN(api_stats.response_size)", display:{id:'MIN(api_stats.response_size)', field:'MIN(api_stats.response_size)', width:220, name:"MIN (Response Size)", groupable:false}},
            {select:"MAX(api_stats.response_size)", display:{id:'MAX(api_stats.response_size)', field:'MAX(api_stats.response_size)', width:220, name:"MAX (Response Size)", groupable:false}},

            {select:"api_stats.response_code", display:{id:'api_stats.response_code', field:'api_stats.response_code', width:200, name:"Response Code", groupable:false}},
            {select:"SUM(api_stats.response_code)", display:{id:'SUM(api_stats.response_code)', field:'SUM(api_stats.response_code)', width:220, name:"SUM (Response Code)", groupable:false}},
            {select:"MIN(api_stats.response_code)", display:{id:'MIN(api_stats.response_code)', field:'MIN(api_stats.response_code)', width:220, name:"MIN (Response Code)", groupable:false}},
            {select:"MAX(api_stats.response_code)", display:{id:'MAX(api_stats.response_code)', field:'MAX(api_stats.response_code)', width:220, name:"MAX (Response Code)", groupable:false}}

        ],

        "StatTable.VrouterStatsAgent.phy_if_band" : [
            {select:"COUNT(phy_if_band)", display:{id:'COUNT(phy_if_band)', field:'COUNT(phy_if_band)', width:150, name:"Count (Phy If Band)", groupable:false}},
            {select:"phy_if_band.name", display:{id:'phy_if_band.name', field:'phy_if_band.name', width:100, name:"Name", groupable:false}},

            {select:"phy_if_band.in_bandwidth_usage", display:{id:'phy_if_band.in_bandwidth_usage', field:'phy_if_band.in_bandwidth_usage', width:200, name:"Phy In BW Usage", groupable:false}},
            {select:"SUM(phy_if_band.in_bandwidth_usage)", display:{id:'SUM(phy_if_band.in_bandwidth_usage)', field:'SUM(phy_if_band.in_bandwidth_usage)', width:220, name:"SUM (Phy In BW Usage)", groupable:false}},
            {select:"MIN(phy_if_band.in_bandwidth_usage)", display:{id:'MIN(phy_if_band.in_bandwidth_usage)', field:'MIN(phy_if_band.in_bandwidth_usage)', width:220, name:"MIN (Phy In BW Usage)", groupable:false}},
            {select:"MAX(phy_if_band.in_bandwidth_usage)", display:{id:'MAX(phy_if_band.in_bandwidth_usage)', field:'MAX(phy_if_band.in_bandwidth_usage)', width:220, name:"MAX (Phy In BW Usage)", groupable:false}},

            {select:"phy_if_band.out_bandwidth_usage", display:{id:'phy_if_band.out_bandwidth_usage', field:'phy_if_band.out_bandwidth_usage', width:200, name:"Phy Out BW Usage", groupable:false}},
            {select:"SUM(phy_if_band.out_bandwidth_usage)", display:{id:'SUM(phy_if_band.out_bandwidth_usage)', field:'SUM(phy_if_band.out_bandwidth_usage)', width:220, name:"SUM (Phy Out BW Usage)", groupable:false}},
            {select:"MIN(phy_if_band.out_bandwidth_usage)", display:{id:'MIN(phy_if_band.out_bandwidth_usage)', field:'MIN(phy_if_band.out_bandwidth_usage)', width:220, name:"MIN (Phy Out BW Usage)", groupable:false}},
            {select:"MAX(phy_if_band.out_bandwidth_usage)", display:{id:'MAX(phy_if_band.out_bandwidth_usage)', field:'MAX(phy_if_band.out_bandwidth_usage)', width:220, name:"MAX (Phy Out BW Usage)", groupable:false}}
        ],

        "StatTable.PRouterBroadViewInfo.ingressPortPriorityGroup" : [
            {select:"COUNT(ingressPortPriorityGroup)", display:{id:'COUNT(ingressPortPriorityGroup)', field:'COUNT(ingressPortPriorityGroup)', width:240, name:"Count (Ingress Port Priority Group)", groupable:false}},
            {select:"asic_id", display:{id:'asic_id', field:'asic_id', width:100, name:"Asic Id", groupable:false}},
            {select:"ingressPortPriorityGroup.port", display:{id:'ingressPortPriorityGroup.port', field:'ingressPortPriorityGroup.port', width:100, name:"Port", groupable:false}},

            {select:"ingressPortPriorityGroup.priorityGroup", display:{id:'ingressPortPriorityGroup.priorityGroup', field:'ingressPortPriorityGroup.priorityGroup', width:180, name:"Priority Group", groupable:false}},
            {select:"SUM(ingressPortPriorityGroup.priorityGroup)", display:{id:'SUM(ingressPortPriorityGroup.priorityGroup)', field:'SUM(ingressPortPriorityGroup.priorityGroup)', width:200, name:"SUM (Priority Group)", groupable:false}},
            {select:"MIN(ingressPortPriorityGroup.priorityGroup)", display:{id:'MIN(ingressPortPriorityGroup.priorityGroup)', field:'MIN(ingressPortPriorityGroup.priorityGroup)', width:200, name:"MIN (Priority Group)", groupable:false}},
            {select:"MAX(ingressPortPriorityGroup.priorityGroup)", display:{id:'MAX(ingressPortPriorityGroup.priorityGroup)', field:'MAX(ingressPortPriorityGroup.priorityGroup)', width:200, name:"MAX (Priority Group)", groupable:false}},

            {select:"ingressPortPriorityGroup.umShareBufferCount", display:{id:'ingressPortPriorityGroup.umShareBufferCount', field:'ingressPortPriorityGroup.umShareBufferCount', width:200, name:"um Shared Buffer Count", groupable:false}},
            {select:"SUM(ingressPortPriorityGroup.umShareBufferCount)", display:{id:'SUM(ingressPortPriorityGroup.umShareBufferCount)', field:'SUM(ingressPortPriorityGroup.umShareBufferCount)', width:220, name:"SUM (um Shared Buffer Count)", groupable:false}},
            {select:"MIN(ingressPortPriorityGroup.umShareBufferCount)", display:{id:'MIN(ingressPortPriorityGroup.umShareBufferCount)', field:'MIN(ingressPortPriorityGroup.umShareBufferCount)', width:220, name:"MIN (um Shared Buffer Count)", groupable:false}},
            {select:"MAX(ingressPortPriorityGroup.umShareBufferCount)", display:{id:'MAX(ingressPortPriorityGroup.umShareBufferCount)', field:'MAX(ingressPortPriorityGroup.umShareBufferCount)', width:220, name:"MAX (um Shared Buffer Count)", groupable:false}},

            {select:"ingressPortPriorityGroup.umHeadroomBufferCount", display:{id:'ingressPortPriorityGroup.umHeadroomBufferCount', field:'ingressPortPriorityGroup.umHeadroomBufferCount', width:220, name:"um Headroom Buffer Count", groupable:false}},
            {select:"SUM(ingressPortPriorityGroup.umHeadroomBufferCount)", display:{id:'SUM(ingressPortPriorityGroup.umHeadroomBufferCount)', field:'SUM(ingressPortPriorityGroup.umHeadroomBufferCount)', width:240, name:"SUM (um Headroom Buffer Count)", groupable:false}},
            {select:"MIN(ingressPortPriorityGroup.umHeadroomBufferCount)", display:{id:'MIN(ingressPortPriorityGroup.umHeadroomBufferCount)', field:'MIN(ingressPortPriorityGroup.umHeadroomBufferCount)', width:240, name:"MIN (um Headroom Buffer Count)", groupable:false}},
            {select:"MAX(ingressPortPriorityGroup.umHeadroomBufferCount)", display:{id:'MAX(ingressPortPriorityGroup.umHeadroomBufferCount)', field:'MAX(ingressPortPriorityGroup.umHeadroomBufferCount)', width:240, name:"MAX (um Headroom Buffer Count)", groupable:false}},
        ],

        "StatTable.PRouterBroadViewInfo.ingressPortServicePool" : [
            {select:"COUNT(ingressPortServicePool)", display:{id:'COUNT(ingressPortServicePool)', field:'COUNT(ingressPortServicePool)', width:220, name:"Count (Ingress Port Service Pool)", groupable:false}},
            {select:"asic_id", display:{id:'asic_id', field:'asic_id', width:100, name:"Asic Id", groupable:false}},
            {select:"ingressPortServicePool.port", display:{id:'ingressPortServicePool.port', field:'ingressPortServicePool.port', width:100, name:"Port", groupable:false}},

            {select:"ingressPortServicePool.servicePool", display:{id:'ingressPortServicePool.servicePool', field:'ingressPortServicePool.servicePool', width:180, name:"Service Pool", groupable:false}},
            {select:"SUM(ingressPortServicePool.servicePool)", display:{id:'SUM(ingressPortServicePool.servicePool)', field:'SUM(ingressPortServicePool.servicePool)', width:200, name:"SUM (Service Pool)", groupable:false}},
            {select:"MIN(ingressPortServicePool.servicePool)", display:{id:'MIN(ingressPortServicePool.servicePool)', field:'MIN(ingressPortServicePool.servicePool)', width:200, name:"MIN (Service Pool)", groupable:false}},
            {select:"MAX(ingressPortServicePool.servicePool)", display:{id:'MAX(ingressPortServicePool.servicePool)', field:'MAX(ingressPortServicePool.servicePool)', width:200, name:"MAX (Service Pool)", groupable:false}},

            {select:"ingressPortServicePool.umShareBufferCount", display:{id:'ingressPortServicePool.umShareBufferCount', field:'ingressPortServicePool.umShareBufferCount', width:200, name:"um Share Buffer Count", groupable:false}},
            {select:"SUM(ingressPortServicePool.umShareBufferCount)", display:{id:'SUM(ingressPortServicePool.umShareBufferCount)', field:'SUM(ingressPortServicePool.umShareBufferCount)', width:220, name:"SUM (um Share Buffer Count)", groupable:false}},
            {select:"MIN(ingressPortServicePool.umShareBufferCount)", display:{id:'MIN(ingressPortServicePool.umShareBufferCount)', field:'MIN(ingressPortServicePool.umShareBufferCount)', width:220, name:"MIN (um Share Buffer Count)", groupable:false}},
            {select:"MAX(ingressPortServicePool.umShareBufferCount)", display:{id:'MAX(ingressPortServicePool.umShareBufferCount)', field:'MAX(ingressPortServicePool.umShareBufferCount)', width:220, name:"MAX (um Share Buffer Count)", groupable:false}}
        ],

        "StatTable.PRouterBroadViewInfo.ingressServicePool" : [
            {select:"COUNT(ingressServicePool)", display:{id:'COUNT(ingressServicePool)', field:'COUNT(ingressServicePool)', width:220, name:"Count (Ingress Port Service Pool)", groupable:false}},
            {select:"asic_id", display:{id:'asic_id', field:'asic_id', width:100, name:"Asic Id", groupable:false}},
            {select:"ingressServicePool.port", display:{id:'ingressServicePool.port', field:'ingressServicePool.port', width:100, name:"Port", groupable:false}},

            {select:"ingressServicePool.servicePool", display:{id:'ingressServicePool.servicePool', field:'ingressServicePool.servicePool', width:180, name:"Service Pool", groupable:false}},
            {select:"SUM(ingressServicePool.servicePool)", display:{id:'SUM(ingressServicePool.servicePool)', field:'SUM(ingressServicePool.servicePool)', width:200, name:"SUM (Service Pool)", groupable:false}},
            {select:"MIN(ingressServicePool.servicePool)", display:{id:'MIN(ingressServicePool.servicePool)', field:'MIN(ingressServicePool.servicePool)', width:200, name:"MIN (Service Pool)", groupable:false}},
            {select:"MAX(ingressServicePool.servicePool)", display:{id:'MAX(ingressServicePool.servicePool)', field:'MAX(ingressServicePool.servicePool)', width:200, name:"MAX (Service Pool)", groupable:false}},

            {select:"ingressServicePool.umShareBufferCount", display:{id:'ingressServicePool.umShareBufferCount', field:'ingressServicePool.umShareBufferCount', width:200, name:"um Share Buffer Count", groupable:false}},
            {select:"SUM(ingressServicePool.umShareBufferCount)", display:{id:'SUM(ingressServicePool.umShareBufferCount)', field:'SUM(ingressServicePool.umShareBufferCount)', width:220, name:"SUM (um Share Buffer Count)", groupable:false}},
            {select:"MIN(ingressServicePool.umShareBufferCount)", display:{id:'MIN(ingressServicePool.umShareBufferCount)', field:'MIN(ingressServicePool.umShareBufferCount)', width:220, name:"MIN (um Share Buffer Count)", groupable:false}},
            {select:"MAX(ingressServicePool.umShareBufferCount)", display:{id:'MAX(ingressServicePool.umShareBufferCount)', field:'MAX(ingressServicePool.umShareBufferCount)', width:220, name:"MAX (um Share Buffer Count)", groupable:false}}
        ],
        "StatTable.PRouterBroadViewInfo.egressPortServicePool" : [
            {select:"COUNT(egressPortServicePool)", display:{id:'COUNT(egressPortServicePool)', field:'COUNT(egressPortServicePool)', width:220, name:"Count (Egress Port Service Pool)", groupable:false}},
            {select:"asic_id", display:{id:'asic_id', field:'asic_id', width:100, name:"Asic Id", groupable:false}},
            {select:"egressPortServicePool.port", display:{id:'egressPortServicePool.port', field:'egressPortServicePool.port', width:100, name:"Port", groupable:false}},

            {select:"egressPortServicePool.servicePool", display:{id:'egressPortServicePool.servicePool', field:'egressPortServicePool.servicePool', width:180, name:"Service Pool", groupable:false}},
            {select:"SUM(egressPortServicePool.servicePool)", display:{id:'SUM(egressPortServicePool.servicePool)', field:'SUM(egressPortServicePool.servicePool)', width:200, name:"SUM (Service Pool)", groupable:false}},
            {select:"MIN(egressPortServicePool.servicePool)", display:{id:'MIN(egressPortServicePool.servicePool)', field:'MIN(egressPortServicePool.servicePool)', width:200, name:"MIN (Service Pool)", groupable:false}},
            {select:"MAX(egressPortServicePool.servicePool)", display:{id:'MAX(egressPortServicePool.servicePool)', field:'MAX(egressPortServicePool.servicePool)', width:200, name:"MAX (Service Pool)", groupable:false}},

            {select:"egressPortServicePool.ucShareBufferCount", display:{id:'egressPortServicePool.ucShareBufferCount', field:'egressPortServicePool.ucShareBufferCount', width:180, name:"um Share Buffer Count", groupable:false}},
            {select:"SUM(egressPortServicePool.ucShareBufferCount)", display:{id:'SUM(egressPortServicePool.ucShareBufferCount)', field:'SUM(egressPortServicePool.ucShareBufferCount)', width:200, name:"SUM (um Share Buffer Count)", groupable:false}},
            {select:"MIN(egressPortServicePool.ucShareBufferCount)", display:{id:'MIN(egressPortServicePool.ucShareBufferCount)', field:'MIN(egressPortServicePool.ucShareBufferCount)', width:200, name:"MIN (um Share Buffer Count)", groupable:false}},
            {select:"MAX(egressPortServicePool.ucShareBufferCount)", display:{id:'MAX(egressPortServicePool.ucShareBufferCount)', field:'MAX(egressPortServicePool.ucShareBufferCount)', width:200, name:"MAX (um Share Buffer Count)", groupable:false}},

            {select:"egressPortServicePool.umShareBufferCount", display:{id:'egressPortServicePool.umShareBufferCount', field:'egressPortServicePool.umShareBufferCount', width:180, name:"um Share Buffer Count", groupable:false}},
            {select:"SUM(egressPortServicePool.umShareBufferCount)", display:{id:'SUM(egressPortServicePool.umShareBufferCount)', field:'SUM(egressPortServicePool.umShareBufferCount)', width:200, name:"SUM (um Share Buffer Count)", groupable:false}},
            {select:"MIN(egressPortServicePool.umShareBufferCount)", display:{id:'MIN(egressPortServicePool.umShareBufferCount)', field:'MIN(egressPortServicePool.umShareBufferCount)', width:200, name:"MIN (um Share Buffer Count)", groupable:false}},
            {select:"MAX(egressPortServicePool.umShareBufferCount)", display:{id:'MAX(egressPortServicePool.umShareBufferCount)', field:'MAX(egressPortServicePool.umShareBufferCount)', width:200, name:"MAX (um Share Buffer Count)", groupable:false}},

            {select:"egressPortServicePool.mcShareBufferCount", display:{id:'egressPortServicePool.mcShareBufferCount', field:'egressPortServicePool.mcShareBufferCount', width:180, name:"mc Share Buffer Count", groupable:false}},
            {select:"SUM(egressPortServicePool.mcShareBufferCount)", display:{id:'SUM(egressPortServicePool.mcShareBufferCount)', field:'SUM(egressPortServicePool.mcShareBufferCount)', width:200, name:"SUM (mc Share Buffer Count)", groupable:false}},
            {select:"MIN(egressPortServicePool.mcShareBufferCount)", display:{id:'MIN(egressPortServicePool.mcShareBufferCount)', field:'MIN(egressPortServicePool.mcShareBufferCount)', width:200, name:"MIN (mc Share Buffer Count)", groupable:false}},
            {select:"MAX(egressPortServicePool.mcShareBufferCount)", display:{id:'MAX(egressPortServicePool.mcShareBufferCount)', field:'MAX(egressPortServicePool.mcShareBufferCount)', width:200, name:"MAX (mc Share Buffer Count)", groupable:false}},

            {select:"egressPortServicePool.mcShareQueueEntries", display:{id:'egressPortServicePool.mcShareQueueEntries', field:'egressPortServicePool.mcShareQueueEntries', width:200, name:"mc Share Queue Entries", groupable:false}},
            {select:"SUM(egressPortServicePool.mcShareQueueEntries)", display:{id:'SUM(egressPortServicePool.mcShareQueueEntries)', field:'SUM(egressPortServicePool.mcShareQueueEntries)', width:220, name:"SUM (mc Share Queue Entries)", groupable:false}},
            {select:"MIN(egressPortServicePool.mcShareQueueEntries)", display:{id:'MIN(egressPortServicePool.mcShareQueueEntries)', field:'MIN(egressPortServicePool.mcShareQueueEntries)', width:220, name:"MIN (mc Share Queue Entries)", groupable:false}},
            {select:"MAX(egressPortServicePool.mcShareQueueEntries)", display:{id:'MAX(egressPortServicePool.mcShareQueueEntries)', field:'MAX(egressPortServicePool.mcShareQueueEntries)', width:220, name:"MAX (mc Share Queue Entries)", groupable:false}}
        ],

        "StatTable.PRouterBroadViewInfo.egressServicePool" : [
            {select:"COUNT(egressServicePool)", display:{id:'COUNT(egressServicePool)', field:'COUNT(egressServicePool)', width:220, name:"Count (Egress Port Service Pool)", groupable:false}},
            {select:"asic_id", display:{id:'asic_id', field:'asic_id', width:100, name:"Asic Id", groupable:false}},
            {select:"egressServicePool.port", display:{id:'egressServicePool.port', field:'egressServicePool.port', width:100, name:"Port", groupable:false}},

            {select:"egressServicePool.servicePool", display:{id:'egressServicePool.servicePool', field:'egressServicePool.servicePool', width:180, name:"Service Pool", groupable:false}},
            {select:"SUM(egressServicePool.servicePool)", display:{id:'SUM(egressServicePool.servicePool)', field:'SUM(egressServicePool.servicePool)', width:200, name:"SUM (Service Pool)", groupable:false}},
            {select:"MIN(egressServicePool.servicePool)", display:{id:'MIN(egressServicePool.servicePool)', field:'MIN(egressServicePool.servicePool)', width:200, name:"MIN (Service Pool)", groupable:false}},
            {select:"MAX(egressServicePool.servicePool)", display:{id:'MAX(egressServicePool.servicePool)', field:'MAX(egressServicePool.servicePool)', width:200, name:"MAX (Service Pool)", groupable:false}},

            {select:"egressServicePool.umShareBufferCount", display:{id:'egressServicePool.umShareBufferCount', field:'egressServicePool.umShareBufferCount', width:180, name:"um Share Buffer Count", groupable:false}},
            {select:"SUM(egressServicePool.umShareBufferCount)", display:{id:'SUM(egressServicePool.umShareBufferCount)', field:'SUM(egressServicePool.umShareBufferCount)', width:200, name:"SUM (um Share Buffer Count)", groupable:false}},
            {select:"MIN(egressServicePool.umShareBufferCount)", display:{id:'MIN(egressServicePool.umShareBufferCount)', field:'MIN(egressServicePool.umShareBufferCount)', width:200, name:"MIN (um Share Buffer Count)", groupable:false}},
            {select:"MAX(egressServicePool.umShareBufferCount)", display:{id:'MAX(egressServicePool.umShareBufferCount)', field:'MAX(egressServicePool.umShareBufferCount)', width:200, name:"MAX (um Share Buffer Count)", groupable:false}},

            {select:"egressServicePool.mcShareBufferCount", display:{id:'egressServicePool.mcShareBufferCount', field:'egressServicePool.mcShareBufferCount', width:180, name:"mc Share Buffer Count", groupable:false}},
            {select:"SUM(egressServicePool.mcShareBufferCount)", display:{id:'SUM(egressServicePool.mcShareBufferCount)', field:'SUM(egressServicePool.mcShareBufferCount)', width:200, name:"SUM (mc Share Buffer Count)", groupable:false}},
            {select:"MIN(egressServicePool.mcShareBufferCount)", display:{id:'MIN(egressServicePool.mcShareBufferCount)', field:'MIN(egressServicePool.mcShareBufferCount)', width:200, name:"MIN (mc Share Buffer Count)", groupable:false}},
            {select:"MAX(egressServicePool.mcShareBufferCount)", display:{id:'MAX(egressServicePool.mcShareBufferCount)', field:'MAX(egressServicePool.mcShareBufferCount)', width:200, name:"MAX (mc Share Buffer Count)", groupable:false}},

            {select:"egressServicePool.mcShareQueueEntries", display:{id:'egressServicePool.mcShareQueueEntries', field:'egressServicePool.mcShareQueueEntries', width:200, name:"mc Share Queue Entries", groupable:false}},
            {select:"SUM(egressServicePool.mcShareQueueEntries)", display:{id:'SUM(egressServicePool.mcShareQueueEntries)', field:'SUM(egressServicePool.mcShareQueueEntries)', width:220, name:"SUM (mc Share Queue Entries)", groupable:false}},
            {select:"MIN(egressServicePool.mcShareQueueEntries)", display:{id:'MIN(egressServicePool.mcShareQueueEntries)', field:'MIN(egressServicePool.mcShareQueueEntries)', width:220, name:"MIN (mc Share Queue Entries)", groupable:false}},
            {select:"MAX(egressServicePool.mcShareQueueEntries)", display:{id:'MAX(egressServicePool.mcShareQueueEntries)', field:'MAX(egressServicePool.mcShareQueueEntries)', width:220, name:"MAX (mc Share Queue Entries)", groupable:false}}
        ],

        "StatTable.PRouterBroadViewInfo.egressUcQueue" : [
            {select:"COUNT(egressUcQueue)", display:{id:'COUNT(egressUcQueue)', field:'COUNT(egressUcQueue)', width:220, name:"Count (Egress Uc Queue)", groupable:false}},
            {select:"asic_id", display:{id:'asic_id', field:'asic_id', width:100, name:"Asic Id", groupable:false}},

            {select:"egressUcQueue.queue", display:{id:'egressUcQueue.queue', field:'egressUcQueue.queue', width:180, name:"Queue", groupable:false}},
            {select:"SUM(egressUcQueue.queue)", display:{id:'SUM(egressUcQueue.queue)', field:'SUM(egressUcQueue.queue)', width:200, name:"SUM (Queue)", groupable:false}},
            {select:"MIN(egressUcQueue.queue)", display:{id:'MIN(egressUcQueue.queue)', field:'MIN(egressUcQueue.queue)', width:200, name:"MIN (Queue)", groupable:false}},
            {select:"MAX(egressUcQueue.queue)", display:{id:'MAX(egressUcQueue.queue)', field:'MAX(egressUcQueue.queue)', width:200, name:"MAX (Queue)", groupable:false}},

            {select:"egressUcQueue.queue", display:{id:'egressUcQueue.ucBufferCount', field:'egressUcQueue.ucBufferCount', width:180, name:"uc Buffer Count", groupable:false}},
            {select:"SUM(egressUcQueue.ucBufferCount)", display:{id:'SUM(egressUcQueue.ucBufferCount)', field:'SUM(egressUcQueue.ucBufferCount)', width:200, name:"SUM (uc Buffer Count)", groupable:false}},
            {select:"MIN(egressUcQueue.ucBufferCount)", display:{id:'MIN(egressUcQueue.ucBufferCount)', field:'MIN(egressUcQueue.ucBufferCount)', width:200, name:"MIN (uc Buffer Count)", groupable:false}},
            {select:"MAX(egressUcQueue.ucBufferCount)", display:{id:'MAX(egressUcQueue.ucBufferCount)', field:'MAX(egressUcQueue.ucBufferCount)', width:200, name:"MAX (uc Buffer Count)", groupable:false}},
        ],
        "StatTable.PRouterBroadViewInfo.egressUcQueueGroup" : [
            {select:"COUNT(egressUcQueueGroup)", display:{id:'COUNT(egressUcQueueGroup)', field:'COUNT(egressUcQueueGroup)', width:220, name:"Count (Egress Uc QueueGroup)", groupable:false}},
            {select:"asic_id", display:{id:'asic_id', field:'asic_id', width:100, name:"Asic Id", groupable:false}},

            {select:"egressUcQueueGroup.queueGroup", display:{id:'egressUcQueueGroup.queueGroup', field:'egressUcQueueGroup.queueGroup', width:180, name:"Queue Group", groupable:false}},
            {select:"SUM(egressUcQueueGroup.queueGroup)", display:{id:'SUM(egressUcQueueGroup.queueGroup)', field:'SUM(egressUcQueueGroup.queueGroup)', width:200, name:"SUM (Queue Group)", groupable:false}},
            {select:"MIN(egressUcQueueGroup.queueGroup)", display:{id:'MIN(egressUcQueueGroup.queueGroup)', field:'MIN(egressUcQueueGroup.queueGroup)', width:200, name:"MIN (Queue Group)", groupable:false}},
            {select:"MAX(egressUcQueueGroup.queueGroup)", display:{id:'MAX(egressUcQueueGroup.queueGroup)', field:'MAX(egressUcQueueGroup.queueGroup)', width:200, name:"MAX (Queue Group)", groupable:false}},

            {select:"egressUcQueueGroup.ucBufferCount", display:{id:'egressUcQueueGroup.ucBufferCount', field:'egressUcQueueGroup.ucBufferCount', width:180, name:"uc Buffer Count", groupable:false}},
            {select:"SUM(egressUcQueueGroup.ucBufferCount)", display:{id:'SUM(egressUcQueueGroup.ucBufferCount)', field:'SUM(egressUcQueueGroup.ucBufferCount)', width:200, name:"SUM (uc Buffer Count)", groupable:false}},
            {select:"MIN(egressUcQueueGroup.ucBufferCount)", display:{id:'MIN(egressUcQueueGroup.ucBufferCount)', field:'MIN(egressUcQueueGroup.ucBufferCount)', width:200, name:"MIN (uc Buffer Count)", groupable:false}},
            {select:"MAX(egressUcQueueGroup.ucBufferCount)", display:{id:'MAX(egressUcQueueGroup.ucBufferCount)', field:'MAX(egressUcQueueGroup.ucBufferCount)', width:200, name:"MAX (uc Buffer Count)", groupable:false}}
        ],
        "StatTable.PRouterBroadViewInfo.egressMcQueue" : [
            {select:"COUNT(egressMcQueue)", display:{id:'COUNT(egressMcQueue)', field:'COUNT(egressMcQueue)', width:220, name:"Count (Egress Mc Queue)", groupable:false}},
            {select:"asic_id", display:{id:'asic_id', field:'asic_id', width:100, name:"Asic Id", groupable:false}},

            {select:"egressMcQueue.queue", display:{id:'egressMcQueue.queue', field:'egressMcQueue.queue', width:180, name:"Queue", groupable:false}},
            {select:"SUM(egressMcQueue.queue)", display:{id:'SUM(egressMcQueue.queue)', field:'SUM(egressMcQueue.queue)', width:200, name:"SUM (Queue)", groupable:false}},
            {select:"MIN(egressMcQueue.queue)", display:{id:'MIN(egressMcQueue.queue)', field:'MIN(egressMcQueue.queue)', width:200, name:"MIN (Queue)", groupable:false}},
            {select:"MAX(egressMcQueue.queue)", display:{id:'MAX(egressMcQueue.queue)', field:'MAX(egressMcQueue.queue)', width:200, name:"MAX (Queue)", groupable:false}},

            {select:"egressMcQueue.mcBufferCount", display:{id:'egressMcQueue.mcBufferCount', field:'egressMcQueue.mcBufferCount', width:180, name:"mc Buffer Count", groupable:false}},
            {select:"SUM(egressMcQueue.mcBufferCount)", display:{id:'SUM(egressMcQueue.mcBufferCount)', field:'SUM(egressMcQueue.mcBufferCount)', width:200, name:"SUM (mc Buffer Count)", groupable:false}},
            {select:"MIN(egressMcQueue.mcBufferCount)", display:{id:'MIN(egressMcQueue.mcBufferCount)', field:'MIN(egressMcQueue.mcBufferCount)', width:200, name:"MIN (mc Buffer Count)", groupable:false}},
            {select:"MAX(egressMcQueue.mcBufferCount)", display:{id:'MAX(egressMcQueue.mcBufferCount)', field:'MAX(egressMcQueue.mcBufferCount)', width:200, name:"MAX (mc Buffer Count)", groupable:false}},

            {select:"egressMcQueue.mcQueueEntries", display:{id:'egressMcQueue.mcQueueEntries', field:'egressMcQueue.mcQueueEntries', width:180, name:"mc Queue Entries", groupable:false}},
            {select:"SUM(egressMcQueue.mcQueueEntries)", display:{id:'SUM(egressMcQueue.mcQueueEntries)', field:'SUM(egressMcQueue.mcQueueEntries)', width:200, name:"SUM (mc Queue Entries)", groupable:false}},
            {select:"MIN(egressMcQueue.mcQueueEntries)", display:{id:'MIN(egressMcQueue.mcQueueEntries)', field:'MIN(egressMcQueue.mcQueueEntries)', width:200, name:"MIN (mc Queue Entries)", groupable:false}},
            {select:"MAX(egressMcQueue.mcQueueEntries)", display:{id:'MAX(egressMcQueue.mcQueueEntries)', field:'MAX(egressMcQueue.mcQueueEntries)', width:200, name:"MAX (mc Queue Entries)", groupable:false}},
        ],
        "StatTable.PRouterBroadViewInfo.egressCpuQueue" : [
            {select:"COUNT(egressCpuQueue)", display:{id:'COUNT(egressCpuQueue)', field:'COUNT(egressCpuQueue)', width:220, name:"Count (Egress Cpu Queue)", groupable:false}},
            {select:"asic_id", display:{id:'asic_id', field:'asic_id', width:100, name:"Asic Id", groupable:false}},

            {select:"egressCpuQueue.queue", display:{id:'egressCpuQueue.queue', field:'egressCpuQueue.queue', width:180, name:"Queue", groupable:false}},
            {select:"SUM(egressCpuQueue.queue)", display:{id:'SUM(egressCpuQueue.queue)', field:'SUM(egressCpuQueue.queue)', width:200, name:"SUM (Queue)", groupable:false}},
            {select:"MIN(egressCpuQueue.queue)", display:{id:'MIN(egressCpuQueue.queue)', field:'MIN(egressCpuQueue.queue)', width:200, name:"MIN (Queue)", groupable:false}},
            {select:"MAX(egressCpuQueue.queue)", display:{id:'MAX(egressCpuQueue.queue)', field:'MAX(egressCpuQueue.queue)', width:200, name:"MAX (Queue)", groupable:false}},

            {select:"egressCpuQueue.cpuBufferCount", display:{id:'egressCpuQueue.cpuBufferCount', field:'egressCpuQueue.cpuBufferCount', width:180, name:"CPU Buffer Count", groupable:false}},
            {select:"SUM(egressCpuQueue.cpuBufferCount)", display:{id:'SUM(egressCpuQueue.cpuBufferCount)', field:'SUM(egressCpuQueue.cpuBufferCount)', width:200, name:"SUM (CPU Buffer Count)", groupable:false}},
            {select:"MIN(egressCpuQueue.cpuBufferCount)", display:{id:'MIN(egressCpuQueue.cpuBufferCount)', field:'MIN(egressCpuQueue.cpuBufferCount)', width:200, name:"MIN (CPU Buffer Count)", groupable:false}},
            {select:"MAX(egressCpuQueue.cpuBufferCount)", display:{id:'MAX(egressCpuQueue.cpuBufferCount)', field:'MAX(egressCpuQueue.cpuBufferCount)', width:200, name:"MAX (CPU Buffer Count)", groupable:false}},
        ],
        "StatTable.PRouterBroadViewInfo.egressRqeQueue" : [
            {select:"COUNT(egressRqeQueue)", display:{id:'COUNT(egressRqeQueue)', field:'COUNT(egressRqeQueue)', width:220, name:"Count (Egress Rqe Queue)", groupable:false}},
            {select:"asic_id", display:{id:'asic_id', field:'asic_id', width:100, name:"Asic Id", groupable:false}},

            {select:"egressRqeQueue.queue", display:{id:'egressRqeQueue.queue', field:'egressRqeQueue.queue', width:180, name:"Queue", groupable:false}},
            {select:"SUM(egressRqeQueue.queue)", display:{id:'SUM(egressRqeQueue.queue)', field:'SUM(egressRqeQueue.queue)', width:200, name:"SUM (Queue)", groupable:false}},
            {select:"MIN(egressRqeQueue.queue)", display:{id:'MIN(egressRqeQueue.queue)', field:'MIN(egressRqeQueue.queue)', width:200, name:"MIN (Queue)", groupable:false}},
            {select:"MAX(egressRqeQueue.queue)", display:{id:'MAX(egressRqeQueue.queue)', field:'MAX(egressRqeQueue.queue)', width:200, name:"MAX (Queue)", groupable:false}},

            {select:"egressRqeQueue.rqeBufferCount", display:{id:'egressRqeQueue.rqeBufferCount', field:'egressRqeQueue.rqeBufferCount', width:180, name:"Rqe Buffer Count", groupable:false}},
            {select:"SUM(egressRqeQueue.rqeBufferCount)", display:{id:'SUM(egressRqeQueue.rqeBufferCount)', field:'SUM(egressRqeQueue.rqeBufferCount)', width:200, name:"SUM (Rqe Buffer Count)", groupable:false}},
            {select:"MIN(egressRqeQueue.rqeBufferCount)", display:{id:'MIN(egressRqeQueue.rqeBufferCount)', field:'MIN(egressRqeQueue.rqeBufferCount)', width:200, name:"MIN (Rqe Buffer Count)", groupable:false}},
            {select:"MAX(egressRqeQueue.rqeBufferCount)", display:{id:'MAX(egressRqeQueue.rqeBufferCount)', field:'MAX(egressRqeQueue.rqeBufferCount)', width:200, name:"MAX (Rqe Buffer Count)", groupable:false}},
        ],
        "defaultStatColumns": [
            {select:"T", display:{id:"T", field:"T", width:210, name:"Time", filterable:false, groupable:false}},
            {select:"T=", display:{id: 'T=', field:'T=', width:210, name:"Time", filterable:false, groupable:false}},
            {select:"UUID", display:{id:"UUID", field:"UUID", name:"UUID",  width:150, groupable:true}},
            {select:"name", display:{id:'name', field:'name', width:150, name:"Name", groupable:false}},
            {select:"Source", display:{id:'Source', field:'Source', width:70, name:"Source", groupable:false}}
        ],
        "defaultObjectColumns": [
            {select: "MessageTS", display:{id: "MessageTS", field: "MessageTS", name: "Time", width:210, filterable:false, groupable:false}},
            {select: "ObjectId", display:{id:"ObjectId", field:"ObjectId", name:"Object Id", width:150, searchable: true, hide: true}},
            {select: "Source", display:{id:"Source", field:"Source", name:"Source", width:150, searchable: true}},
            {select: "ModuleId", display:{id: "ModuleId", field: "ModuleId", name: "Module Id", width: 200, searchable:true}},
            {select: "Messagetype", display:{id:"Messagetype", field:"Messagetype", name:"Message Type", width:150, searchable:true}},
            {
                select: "ObjectLog",
                display:{
                    id:"ObjectLog", field:"ObjectLog", name:"Object Log", width:300, searchable:true,
                    formatter: {
                        format: [
                            {format: 'xml2json', options: {jsonValuePath: 'ObjectLogJSON'}},
                            {format: 'json2html', options: {jsonValuePath: 'ObjectLogJSON', htmlValuePath: 'ObjectLogHTML', expandLevel: 0}}
                        ]
                    },
                    exportConfig: {
                        allow: true,
                        stdFormatter: false
                    }
                }
            },
            {
                select: "SystemLog",
                display:{
                    id:"SystemLog", field:"SystemLog", name:"System Log", width:300, searchable:true,
                    formatter: {
                        format: [
                            {format: 'xml2json', options: {jsonValuePath: 'SystemLogJSON'}},
                            {format: 'json2html', options: {jsonValuePath: 'SystemLogJSON', htmlValuePath: 'SystemLogHTML', expandLevel: 0}}
                        ]
                    },
                    exportConfig: {
                        allow: true,
                        stdFormatter: false
                    }
                }
            }
        ],
        "MessageTable": [
            {select: "MessageTS", display:{id: "MessageTS", field: "MessageTS", name: "Time", width:210, filterable:false, groupable:false}},
            {select: "Source", display:{id:"Source", field:"Source", name:"Source", width:150, searchable: true}},
            {select: "NodeType", display:{id:"NodeType", field:"NodeType", name:"Node Type", width:100, searchable: true}},
            {select: "ModuleId", display:{id: "ModuleId", field: "ModuleId", name: "Module Id", width: 200, searchable:true}},
            {select: "Messagetype", display:{id:"Messagetype", field:"Messagetype", name:"Message Type", width:150, searchable:true}},
            {select: "Keyword", display:{id:"Keyword", field:"Keyword", name:"Keyword", width:150, searchable:true}},
            {select: "Level", display:{id:"Level", field:"Level", name:"Level", width:100, searchable:true, formatter: function(r, c, v, cd, dc) { return qewu.getLevelName4Value(dc.Level); }}},
            {select: "Category", display:{id: "Category", field: "Category", name: "Category", width: 150, searchable:true}},
            {select: "Context", display:{id:"Context", field:"Context", name:"Context", width:150, searchable:true}},
            {
                select: "Xmlmessage",
                display:{
                    id:"Xmlmessage", field:"Xmlmessage", name:"Log Message", width:500, searchable:true,
                    formatter: function(r, c, v, cd, dc) {
                        var xmlMessage = [];
                        if (contrail.checkIfExist(dc.Xmlmessage)) {
                            if (!$.isPlainObject(dc.Xmlmessage)) {
                                dc.XmlmessageJSON = cowu.formatXML2JSON(dc.Xmlmessage);

                                xmlMessage = $.map(dc.XmlmessageJSON, function(messageValue, messageKey) {
                                    return messageValue;
                                });
                                dc.formattedXmlMessage = xmlMessage.join(' ');
                            }


                        }

                        return dc.formattedXmlMessage
                    },
                    exportConfig: {
                        allow: true,
                        stdFormatter: false
                    }
                }
            },
            {select: "InstanceId", display:{id: "InstanceId", field: "InstanceId", name: "Instance Id", width: 150, searchable:true}}
        ],
        init: function() {
            this.SessionAnalyzerTable = this.FlowSeriesTable;
            delete this.init;
            return this;
        }
    }.init();

    return new QEGridConfig();
});

/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */

define('core-basedir/js/views/QueryResultGridView',[
    'underscore',
    'contrail-view',
    'contrail-list-model',
    'js/common/qe.grid.config'
], function (_, ContrailView, ContrailListModel,qewgc) {

    var QueryResultGridView = ContrailView.extend({
        render: function () {
            var self = this,
                viewConfig = self.attributes.viewConfig,
                queryRequestPostData = viewConfig.queryRequestPostData,
                queryFormAttributes = contrail.checkIfExist(viewConfig.queryFormAttributes) ? viewConfig.queryFormAttributes.formModelAttrs : queryRequestPostData.formModelAttrs,
                formQueryIdSuffix = contrail.checkIfKeyExistInObject(true, viewConfig.queryFormAttributes, 'queryId') ? '-' + viewConfig.queryFormAttributes.queryId : '',
                queryResultGridId = contrail.checkIfExist(viewConfig.queryResultGridId) ? viewConfig.queryResultGridId : cowl.QE_QUERY_RESULT_GRID_ID + formQueryIdSuffix,
                modelMap = contrail.handleIfNull(self.modelMap, {}),
                gridOptions = viewConfig['gridOptions'],
                queryGridListModel = null,
                queryResultRemoteConfig,
                listModelConfig;

            //self.model here is QueryFormModel. for rendering Grid we will use the list model from model map or create new one.
            if (contrail.checkIfExist(viewConfig.modelKey) && contrail.checkIfExist(modelMap[viewConfig.modelKey])) {
                queryGridListModel = modelMap[viewConfig.modelKey]
            }

            if (queryGridListModel === null && contrail.checkIfExist(viewConfig.modelConfig)) {
                listModelConfig = viewConfig['modelConfig'];
                queryResultRemoteConfig = listModelConfig['remote'].ajaxConfig;
                queryGridListModel = new ContrailListModel(listModelConfig);
            }

            //Create listModel config using the viewConfig parameters.
            if (queryGridListModel === null && !contrail.checkIfExist(viewConfig.modelConfig)) {
                queryResultRemoteConfig = {
                    url: "/api/qe/query",
                    type: 'POST',
                    data: JSON.stringify(queryRequestPostData)
                };

                listModelConfig = {
                    remote: {
                        ajaxConfig: queryResultRemoteConfig,
                        dataParser: function(response) {
                            return response['data'];
                        },
                        successCallback: function(resultJSON, contrailListModel, response) {
                            if (response.status === 'queued') {
                                $('#' + queryResultGridId).data('contrailGrid').showGridMessage(response.status)
                            } else if (contrailListModel.getItems().length == 0) {
                                //TODO - get rid of this
                                setTimeout(function(){
                                    $('#' + queryResultGridId).data('contrailGrid').showGridMessage('empty')
                                }, 1000);
                            }
                        }
                    }
                };

                queryGridListModel = new ContrailListModel(listModelConfig);
            }

            modelMap[cowc.UMID_QUERY_RESULT_LIST_MODEL] = queryGridListModel;

            self.renderView4Config(self.$el, queryGridListModel, getQueryResultGridViewConfig(queryResultRemoteConfig, queryResultGridId, queryFormAttributes, gridOptions), null, null, modelMap);
        }
    });

    function getQueryResultGridViewConfig(queryResultRemoteConfig, queryResultGridId, queryFormAttributes, gridOptions) {
        return {
            elementId: queryResultGridId,
            title: cowl.TITLE_RESULTS,
            iconClass: 'icon-table',
            view: "GridView",
            tabConfig: {
                activate: function(event, ui) {
                    if ($('#' + queryResultGridId).data('contrailGrid')) {
                        $('#' + queryResultGridId).data('contrailGrid').refreshView();
                    }
                }
            },
            viewConfig: {
                elementConfig: getQueryResultGridConfig(queryResultRemoteConfig, queryFormAttributes, gridOptions)
            }
        };
    }

    function getQueryResultGridConfig(queryResultRemoteConfig, queryFormAttributes, gridOptions) {
        var selectArray = queryFormAttributes.select.replace(/ /g, "").split(","),
            queryResultGridColumns = qewgc.getColumnDisplay4Grid(queryFormAttributes.table_name, queryFormAttributes.table_type, selectArray);

        if (contrail.checkIfExist(gridOptions.gridColumns)) {
            queryResultGridColumns = gridOptions.gridColumns.concat(queryResultGridColumns)
        }

        return qewgc.getQueryGridConfig(queryResultRemoteConfig, queryResultGridColumns, gridOptions);
    };

    return QueryResultGridView;
});

/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */

define('core-basedir/js/views/QueryResultLineChartView',[
    'underscore',
    'contrail-view',
    'contrail-list-model'
], function (_, ContrailView, ContrailListModel) {

    var QueryResultLineChartView = ContrailView.extend({
        render: function() {
            var self = this,
                viewConfig = self.attributes.viewConfig,
                queryId = viewConfig['queryId'],
                queryFormAttributes = viewConfig['queryFormAttributes'],
                queryResultChartGridId = viewConfig.queryResultChartGridId,
                modelMap = contrail.handleIfNull(self.modelMap, {});

            var clickOutView = (contrail.checkIfExist(viewConfig.clickOutElementId)) ? self.rootView.viewMap[viewConfig.clickOutElementId] : self;

            modelMap[cowc.UMID_QUERY_RESULT_LINE_CHART_MODEL] = new ContrailListModel({data: []});
            modelMap[cowc.UMID_QUERY_RESULT_CHART_MODEL] = getChartDataModel(queryId, queryFormAttributes, modelMap);
            self.renderView4Config(self.$el, null, getQueryChartViewConfig(queryId, queryFormAttributes, modelMap, clickOutView, queryResultChartGridId), null, null, modelMap);
        }
    });

    function getQueryChartViewConfig(queryId, queryFormAttributes, modelMap, parentView, queryResultChartGridId) {
        var queryResultChartGroupUrl = '/api/qe/query/chart-groups?queryId=' + queryId,
            selectArray = queryFormAttributes.select.replace(/ /g, "").split(","),
            queryIdSuffix = '-' + queryId,
            aggregateSelectFields = qewu.getAggregateSelectFields(selectArray),
            queryResultLineChartId = cowl.QE_QUERY_RESULT_LINE_CHART_ID + queryIdSuffix,
            chartAxesOptions = {};

        $.each(aggregateSelectFields, function(selectFieldKey, selectFieldValue) {
            var yFormatterKey = cowc.QUERY_COLUMN_FORMATTER[selectFieldValue];

            chartAxesOptions[selectFieldValue] = {
                axisLabelDistance: 5,
                yAxisLabel: selectFieldValue,
                yAxisDataField: selectFieldValue,
                forceY: [0, 10],
                yFormatter: function (d) {
                    return cowf.getFormattedValue(yFormatterKey, d)
                }
            };
        });

        return {
            elementId: cowl.QE_QUERY_RESULT_CHART_PAGE_ID + queryIdSuffix,
            view: "SectionView",
            viewConfig: {
                rows: [
                    {
                        columns: [
                            {
                                elementId: queryResultLineChartId,
                                title: cowl.TITLE_CHART,
                                view: "LineWithFocusChartView",
                                viewConfig: {
                                    widgetConfig: {
                                        elementId: queryResultLineChartId + '-widget',
                                        view: "WidgetView",
                                        viewConfig: {
                                            header: false,
                                            controls: {
                                                top: false,
                                                right: {
                                                    custom: {
                                                        filterChart: {
                                                            enable: true,
                                                            viewConfig: getFilterConfig(queryId, aggregateSelectFields, queryResultLineChartId)
                                                        }
                                                    },
                                                    expandedContainerWidth: (queryFormAttributes.query_prefix === cowc.FS_QUERY_PREFIX) ? 200 : 245
                                                }
                                            }
                                        }
                                    },
                                    chartOptions: {
                                        chartAxesOptions: chartAxesOptions,
                                        chartAxesOptionKey: aggregateSelectFields[0]
                                    },
                                    loadChartInChunks: true,
                                    modelKey: cowc.UMID_QUERY_RESULT_LINE_CHART_MODEL
                                }
                            }
                        ]
                    },
                    {
                        columns: [
                            {
                                elementId: queryResultChartGridId,
                                view: "GridView",
                                viewConfig: {
                                    elementConfig: getChartGridViewConfig(queryId, queryResultChartGroupUrl, queryFormAttributes, modelMap, parentView)
                                }
                            }
                        ]
                    }
                ]
            }
        }
    };

    function getBadgeColorkey(chartColorAvailableKeys) {
        var badgeColorKey = null;

        $.each(chartColorAvailableKeys, function(colorKey, colorValue) {
           if (colorValue === null) {
               badgeColorKey = colorKey;
               return false;
           }
        });

        return badgeColorKey
    }

    function getChartGridViewConfig(queryId, queryResultChartGroupUrl, queryFormAttributes, modelMap, parentView) {
        var selectArray = queryFormAttributes.select.replace(/ /g, "").split(","),
            lineWithFocusChartModel = modelMap[cowc.UMID_QUERY_RESULT_LINE_CHART_MODEL],
            chartColorAvailableKeys = ['id_0', null, null, null, null],
            actionCell = [],
            display = [
                {
                    id: 'fc-badge', field:"", name:"", resizable: false, sortable: false, width: 30, minWidth: 30, searchable: false, exportConfig: { allow: false },
                    formatter: function(r, c, v, cd, dc){
                        return '<span class="label-icon-badge label-icon-badge-' + dc.cgrid + ((r === 0) ? ' icon-badge-color-0' : '') + '" data-color_key="' + ((r === 0) ? 0 : -1) + '"><i class="icon-sign-blank"></i></span>';
                    },
                    events: {
                        onClick: function(e, dc) {
                            var badgeElement = $(e.target).parent(),
                                badgeColorKey = badgeElement.data('color_key');

                            if (badgeColorKey >= 0 && _.compact(chartColorAvailableKeys).length > 1) {
                                badgeElement.data('color_key', -1);
                                badgeElement.removeClass('icon-badge-color-' + badgeColorKey);
                                chartColorAvailableKeys[badgeColorKey] = null;
                                lineWithFocusChartModel.setData(formatChartData(modelMap, queryFormAttributes, chartColorAvailableKeys));
                            } else if (badgeColorKey < 0) {
                                badgeColorKey =  getBadgeColorkey(chartColorAvailableKeys);

                                if (badgeColorKey !== null) {
                                    badgeElement.data('color_key', badgeColorKey);
                                    badgeElement.addClass('icon-badge-color-' + badgeColorKey);
                                    chartColorAvailableKeys[badgeColorKey] = dc.cgrid;
                                    lineWithFocusChartModel.setData(formatChartData(modelMap, queryFormAttributes, chartColorAvailableKeys));
                                }
                            }
                        }
                    }
                }
            ],
            columnDisplay = qewgc.getColumnDisplay4ChartGroupGrid(queryFormAttributes.table_name, queryFormAttributes.table_type, selectArray);

        if (queryFormAttributes.query_prefix === cowc.FS_QUERY_PREFIX) {

            if (qewu.enableSessionAnalyzer(null, queryFormAttributes)) {
                actionCell = [
                    {
                        title: 'Analyze Session',
                        iconClass: 'icon-external-link-sign',
                        onClick: qewgc.getOnClickSessionAnalyzer(parentView, queryId, queryFormAttributes)
                    }
                ]
            }
        }

        columnDisplay = display.concat(columnDisplay);

        var viewConfig = {
            header: {},
            columnHeader: {
                columns: columnDisplay
            },
            body: {
                options: {
                    autoRefresh: false,
                    checkboxSelectable: false,
                    fixedRowHeight: 30,
                    actionCell: actionCell
                },
                dataSource:{
                    remote: {
                        ajaxConfig: {
                            url: queryResultChartGroupUrl,
                            type: 'GET'
                        }
                    }
                }
            },
            footer: {
                pager: {
                    options: {
                        pageSize: 100,
                        pageSizeSelect: [100, 200, 500]
                    }
                }
            }
        };

        return viewConfig;
    };

    function getChartDataModel(queryId, queryFormAttributes, modelMap) {
        var lineWithFocusChartModel = modelMap[cowc.UMID_QUERY_RESULT_LINE_CHART_MODEL],
            chartUrl = '/api/admin/reports/query/chart-data?queryId=' + queryId,
            chartListModel = new ContrailListModel({
            remote: {
                ajaxConfig: {
                    url: chartUrl,
                    type: 'GET'
                },
                dataParser: qewp.fsQueryDataParser
            }
        });

        chartListModel.onAllRequestsComplete.subscribe(function() {
            if (chartListModel.getLength() > 0) {
                var chartColorAvailableKeys = ['id_0', null, null, null, null];
                lineWithFocusChartModel.setData(formatChartData(modelMap, queryFormAttributes, chartColorAvailableKeys));
            } else {
                lineWithFocusChartModel.setData([])
            }

        });

        return chartListModel;
    };

    function formatChartData(modelMap, queryFormAttributes, chartColorAvailableKeys) {
        var chartListModel = modelMap[cowc.UMID_QUERY_RESULT_CHART_MODEL],
            selectArray = queryFormAttributes.select.replace(/ /g, "").split(","),
            aggregateSelectFields = qewu.getAggregateSelectFields(selectArray),
            chartData = [];

        $.each(chartColorAvailableKeys, function(colorKey, colorValue) {
            if (colorValue !== null) {

                var chartDataRow = chartListModel.getItemById(colorValue),
                    chartDataValue = {
                        cgrid: 'id_' + colorKey,
                        key: colorKey,
                        values: [],
                        color: cowc.D3_COLOR_CATEGORY7[colorKey]
                    };

                qewu.addChartMissingPoints(chartDataRow, queryFormAttributes, aggregateSelectFields);

                $.each(chartDataRow.values, function (fcItemKey, fcItemValue) {
                    var ts = parseInt(fcItemKey),
                        chartDataValueItemObj = {x: ts};

                    $.each(aggregateSelectFields, function(selectFieldKey, selectFieldValue) {
                        chartDataValueItemObj[selectFieldValue] = fcItemValue[selectFieldValue]
                    });

                    chartDataValue.values.push(chartDataValueItemObj);
                });

                chartData.push(chartDataValue);
            }
        });

        return chartData
    };

    function getFilterConfig(queryId, aggregateSelectFields, queryResultLineChartId, modelMap) {
        var filterConfig = {
            groups: [
                {
                    id: 'by-node-color-' + queryId,
                    title: false,
                    type: 'radio',
                    items: []
                }
            ]
        };

        $.each(aggregateSelectFields, function(selectFieldKey, selectFieldValue) {
            filterConfig.groups[0].items.push({
                text: selectFieldValue,
                events: {
                    click: function(event) {
                        var chartModel = $('#' + queryResultLineChartId).data('chart'),
                            chartOptions = chartModel.chartOptions,
                            chartAxesOption = chartOptions.chartAxesOptions[selectFieldValue];

                        chartModel.yAxis.axisLabel(chartAxesOption.yAxisLabel)
                            .axisLabelDistance(chartAxesOption.axisLabelDistance)
                            .tickFormat(chartAxesOption['yFormatter'])
                            .showMaxMin(false);

                        chartModel.lines.forceY(chartAxesOption.forceY);
                        chartModel.lines2.forceY(chartAxesOption.forceY);

                        chartModel.chartOptions.chartAxesOptionKey = selectFieldValue;
                        chartModel.update();
                    }
                }
            })
        });

        return filterConfig
    };

    return QueryResultLineChartView;
});
/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */

define('core-basedir/js/views/QuerySelectView',[
    'underscore',
    'contrail-view',
    'knockback'
], function (_, ContrailView, Knockback) {

    var QuerySelectView = ContrailView.extend({
        render: function (renderConfig) {
            var self = this,
                viewConfig = self.attributes.viewConfig,
                selectTemplate = contrail.getTemplate4Id(ctwc.TMPL_QUERY_SELECT),
                queryPrefix = self.model.query_prefix(),
                modalId = queryPrefix + cowl.QE_SELECT_MODAL_SUFFIX,
                className = viewConfig['className'];

            var selectDataObject = self.model.select_data_object(),
                selectTmplData = {queryPrefix: self.model.query_prefix(), fields: $.makeArray(selectDataObject.select_fields)},
                selectTmplHtml = selectTemplate(selectTmplData);

            cowu.createModal({
                'modalId': modalId, 'className': className, 'title': cowl.TITLE_QE_SELECT, 'body': selectTmplHtml, 'onSave': function () {
                    self.model.saveSelect({
                        init: function () {
                            self.model.showErrorAttr(queryPrefix + cowc.FORM_SUFFIX_ID, false);
                            cowu.enableModalLoading(modalId);
                        },
                        success: function () {
                            if (contrail.checkIfExist(renderConfig) && contrail.checkIfFunction(renderConfig['callback'])) {
                                renderConfig['callback']();
                            }

                            //TODO - Quick Fix to adjust the height of where textarea; Can be done in cleaner way
                            $(self.$el).find('[name="select"]')
                                .height(0)
                                .height($(self.$el).find('[name="select"]').get(0).scrollHeight - 5);

                            $("#" + modalId).modal('hide');
                            $("#" + modalId).remove();
                        },
                        error: function (error) {
                            cowu.disableModalLoading(modalId, function () {
                                self.model.showErrorAttr(queryPrefix + cowc.FORM_SUFFIX_ID, error.responseText);
                            });
                        }
                    }); // TODO: Release binding on successful configure
                }, 'onCancel': function () {
                    $("#" + modalId).modal('hide');
                    $("#" + modalId).remove();
                }
            });

            Knockback.applyBindings(self.model, document.getElementById(modalId));
        }
    });

    return QuerySelectView;
});
/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */

define('core-basedir/js/views/QueryWhereView',[
    'underscore',
    'contrail-view',
    'knockback'
], function (_, ContrailView, Knockback) {

    var QueryWhereView = ContrailView.extend({
        render: function (renderConfig) {
            var self = this,
                viewConfig = self.attributes.viewConfig,
                editTemplate = contrail.getTemplate4Id(cowc.TMPL_EDIT_FORM),
                queryPrefix = self.model.query_prefix(),
                modalId = queryPrefix + cowl.QE_WHERE_MODAL_SUFFIX,
                whereTmplHtml = editTemplate({prefixId: queryPrefix}),
                className = viewConfig['className'];

            cowu.createModal({
                'modalId': modalId, 'className': className, 'title': cowl.TITLE_QE_WHERE, 'body': whereTmplHtml, 'onSave': function () {
                    self.model.saveWhere({
                        init: function () {
                            self.model.showErrorAttr(queryPrefix + cowc.FORM_SUFFIX_ID, false);
                            cowu.enableModalLoading(modalId);
                        },
                        success: function () {
                            if (contrail.checkIfExist(renderConfig) && contrail.checkIfFunction(renderConfig['callback'])) {
                                renderConfig['callback']();
                            }

                            //TODO - Quick Fix to adjust the height of where textarea; Can be done in cleaner way
                            $(self.$el).find('[name="where"]')
                                .height(0)
                                .height($(self.$el).find('[name="where"]').get(0).scrollHeight - 5);

                            $("#" + modalId).modal('hide');
                            $("#" + modalId).remove();
                        },
                        error: function (error) {
                            cowu.disableModalLoading(modalId, function () {
                                self.model.showErrorAttr(queryPrefix + cowc.FORM_SUFFIX_ID, error.responseText);
                            });
                        }
                    }); // TODO: Release binding on successful configure
                }, 'onCancel': function () {
                    $("#" + modalId).modal('hide');
                    $("#" + modalId).remove();
                }
            });

            self.renderView4Config($("#" + queryPrefix + "-form"), this.model, getWhereCollectionViewConfig(queryPrefix), null, null, null, function () {
                self.model.showErrorAttr(queryPrefix + cowc.FORM_SUFFIX_ID, false);
                Knockback.applyBindings(self.model, document.getElementById(modalId));
                kbValidation.bind(self);
            });
        }
    });

    function getWhereCollectionViewConfig(queryPrefix) {
        return {
            elementId: 'or-clause-collection',
            view: "FormCollectionView",
            viewConfig: {
                collection: 'where_or_clauses()',
                templateId: cowc.TMPL_QUERY_OR_COLLECTION_VIEW,
                accordionable: true,
                accordionConfig: {
                    header: '.or-clause-header'
                },
                rows: [
                    {
                        rowActions: [
                            {
                                onClick: 'addOrClauseAtIndex()', iconClass: 'icon-plus',
                                viewConfig: {width: 20}
                            },
                            {
                                onClick: "deleteWhereOrClause()", iconClass: 'icon-remove',
                                viewConfig: {width: 20}
                            },
                        ],
                        columns: [
                            {
                                elementId: 'and-clause-collection',
                                view: "FormCollectionView",
                                viewConfig: {
                                    collection: 'and_clauses()',
                                    rows: [
                                        {
                                            rowActions: [
                                                {
                                                    onClick: "deleteWhereAndClause()", iconClass: 'icon-remove',
                                                    viewConfig: {width: 20}
                                                },
                                                {
                                                    onClick: "addAndClauseAtIndex()", iconClass: 'icon-plus',
                                                    viewConfig: {width: 20}
                                                }
                                            ],
                                            columns: [
                                                {
                                                    elementId: 'and-text',
                                                    view: "FormTextView",
                                                    viewConfig: {
                                                        width: 40,
                                                        value: "AND",
                                                        class: "and-clause-text"
                                                    }
                                                },
                                                {
                                                    elementId: 'name',
                                                    name: 'Name',
                                                    view: "FormDropdownView",
                                                    class: "",
                                                    viewConfig: {
                                                        templateId: cowc.TMPL_EDITABLE_GRID_DROPDOWN_VIEW,
                                                        path: "name",
                                                        dataBindValue: "name",
                                                        dataBindOptionList: 'getNameOptionList',
                                                        width: 150,
                                                        elementConfig: {
                                                            placeholder: 'Select Name',
                                                            defaultValueId: 0
                                                        }
                                                    }
                                                },
                                                {
                                                    elementId: 'operator',
                                                    name: 'operator',
                                                    view: "FormDropdownView",
                                                    class: "",
                                                    viewConfig: {
                                                        templateId: cowc.TMPL_EDITABLE_GRID_DROPDOWN_VIEW,
                                                        path: "operator",
                                                        dataBindValue: "operator",
                                                        dataBindOptionList: 'getWhereOperatorOptionList',
                                                        width: 80,
                                                        elementConfig: {
                                                            defaultValueId: 0
                                                        }
                                                    }
                                                },
                                                {
                                                    elementId: 'value',
                                                    name: 'value',
                                                    view: "FormComboboxView",
                                                    class: "",
                                                    viewConfig: {
                                                        templateId: cowc.TMPL_EDITABLE_GRID_COMBOBOX_VIEW,
                                                        path: "value",
                                                        dataBindValue: "value()",
                                                        dataBindOptionList: 'getValueOptionList',
                                                        width: 200,
                                                        elementConfig: {
                                                            placeholder: 'Select Value'
                                                        }
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            visible: "$root.isSuffixVisible(name())",
                                            columns: [
                                                {
                                                    elementId: 'suffix-and-text',
                                                    view: "FormTextView",
                                                    viewConfig: {
                                                        width: 40,
                                                        value: "",
                                                        class: 'suffix-and-clause-text'
                                                    }
                                                }, {
                                                    elementId: 'suffix-name',
                                                    name: 'suffix_name',
                                                    view: "FormDropdownView",
                                                    class: "",
                                                    viewConfig: {
                                                        templateId: cowc.TMPL_EDITABLE_GRID_DROPDOWN_VIEW,
                                                        path: "suffix_name",
                                                        dataBindValue: "suffix_name",
                                                        dataBindOptionList: 'getSuffixNameOptionList',
                                                        width: 150,
                                                        elementConfig: {
                                                            placeholder: 'Select Suffix Name',
                                                            defaultValueId: 0
                                                        }
                                                    }
                                                },
                                                {
                                                    elementId: 'suffix-operator',
                                                    name: 'suffix_operator',
                                                    view: "FormDropdownView",
                                                    class: "",
                                                    viewConfig: {
                                                        templateId: cowc.TMPL_EDITABLE_GRID_DROPDOWN_VIEW,
                                                        path: "suffix_operator",
                                                        dataBindValue: "suffix_operator",
                                                        width: 80,
                                                        elementConfig: {
                                                            data: [{id: '=', text: '='}],
                                                            defaultValueId: 0
                                                        }
                                                    }
                                                },
                                                {
                                                    elementId: 'suffix-value',
                                                    name: 'suffix_value',
                                                    view: "FormComboboxView",
                                                    class: "",
                                                    viewConfig: {
                                                        templateId: cowc.TMPL_EDITABLE_GRID_COMBOBOX_VIEW,
                                                        path: "suffix_value",
                                                        dataBindValue: "suffix_value()",
                                                        width: 200,
                                                        elementConfig: {
                                                            placeholder: 'Select Suffix Value'
                                                        }
                                                    }
                                                }
                                            ]
                                        }
                                    ]
                                }
                            }
                        ]
                    }
                ]
            }

        };
    };

    return QueryWhereView;
});
define('core-basedir/js/models/SparklineModel',[
    'underscore'
], function (_) {
    var SparklineModel = function(chartOptions) {
        
    }
    return SparklineModel;
});
/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */

define('core-basedir/js/views/SparklineView',[
    'underscore',
    'contrail-view',
    'core-basedir/js/models/SparklineModel',
    'contrail-list-model'
], function (_, ContrailView, SparklineModel, ContrailListModel) {
    var SparklineView = ContrailView.extend({
        render: function () {
            var viewConfig = this.attributes.viewConfig,
            ajaxConfig = viewConfig['ajaxConfig'],
            self = this, deferredObj = $.Deferred(),
            selector = $(self.$el);

            if (self.model === null && viewConfig['modelConfig'] != null) {
                self.model = new ContrailListModel(viewConfig['modelConfig']);
            }
            if (self.model !== null) {
                if (self.model.loadedFromCache || !(self.model.isRequestInProgress())) {
                    self.renderSparkline(selector, viewConfig, self.model);
                }
                self.model.onAllRequestsComplete.subscribe(function () {
                    self.renderSparkline(selector, viewConfig, self.model);
                });
                if (viewConfig.loadChartInChunks) {
                    self.model.onDataUpdate.subscribe(function () {
                        self.renderSparkline(selector, viewConfig, self.model);
                    });
                }
            }
        },
        renderSparkline: function (selector, viewConfig, chartViewModel) {
            var data = chartViewModel.getItems();
            var lineColorClass = contrail.checkIfExist(viewConfig.colorClass) ?
                    viewConfig.colorClass : 'blue-sparkline';
            var chartTemplate = contrail.getTemplate4Id('core-sparkline-template');
            var widgetConfig = contrail.checkIfExist(viewConfig.widgetConfig) ?
                    viewConfig.widgetConfig : null;
            var chartViewConfig, chartOptions, chartModel;

            if (contrail.checkIfFunction(viewConfig['parseFn'])) {
                data = viewConfig['parseFn'](data);
            }
            chartModel = new SparklineModel();
            this.chartModel = chartModel;

            if ($(selector).find("svg") != null) {
                $(selector).empty();
            }
            //Store the chart object as a data attribute so that the chart can be updated dynamically
            $(selector).data('chart', chartModel);

            //Draw chart
            var sortedData = ([].concat(data)).sort(function (a, b) {
                return a - b
            });
            var graph = d3.select($(selector)[0]).append("svg:svg").attr('class', lineColorClass);
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

        }

    });
    return SparklineView;
});
/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */

define('core-basedir/js/views/TabsView',[
    'underscore',
    'contrail-view'
], function (_, ContrailView) {
    var TabsView = ContrailView.extend({
        render: function () {
            var self = this,
                viewConfig = self.attributes.viewConfig,
                elId = self.attributes.elementId,
                tabsTemplate = contrail.getTemplate4Id(cowc.TMPL_TABS_VIEW),
                tabsUIObj;

                self.tabs = viewConfig['tabs'];
                self.tabsIdMap = {};
                self.tabRendered = [];

            self.$el.html(tabsTemplate({elementId: elId, tabs: self.tabs}));

            $.each(self.tabs, function(tabKey, tabValue) {
                self.tabsIdMap[tabValue[cowc.KEY_ELEMENT_ID] + '-tab'] = tabKey;
                if (contrail.checkIfKeyExistInObject(true, tabValue, 'tabConfig.renderOnActivate') &&  tabValue.tabConfig.renderOnActivate === true) {
                    self.tabRendered.push(false);
                } else {
                    self.renderTab(tabValue);
                    self.tabRendered.push(true);
                }
            });

            $('#' + elId).contrailTabs({
                active: contrail.handleIfNull(viewConfig.active, 0),
                activate: function( event, ui ) {
                    var tabId = ($(ui.newPanel[0]).attr('id')),
                        tabKey = self.tabsIdMap[tabId];

                    if (contrail.checkIfFunction(viewConfig.activate)) {
                        viewConfig.activate(event, ui);
                    }

                    if (contrail.checkIfExist(self.tabs[tabKey].tabConfig) && contrail.checkIfFunction(self.tabs[tabKey].tabConfig.activate)) {
                        self.tabs[tabKey].tabConfig.activate(event, ui);
                    }
                },
                beforeActivate: function( event, ui ) {
                    var tabId = ($(ui.newPanel[0]).attr('id')),
                        tabKey = self.tabsIdMap[tabId];

                    if (self.tabRendered[tabKey] === false) {
                        self.renderTab(self.tabs[tabKey]);
                        self.tabRendered[tabKey] = true;
                    }
                },
                create: function( event, ui ) {
                    var tabId = ($(ui.panel[0]).attr('id')),
                        tabKey = self.tabsIdMap[tabId];

                    if (self.tabRendered[tabKey] === false) {
                        self.renderTab(self.tabs[tabKey]);
                        self.tabRendered[tabKey] = true;
                    }
                },
                theme: viewConfig.theme
            });

            tabsUIObj = $('#' + elId).data('contrailTabs')._tabsUIObj;

            tabsUIObj.delegate( ".contrail-tab-link-icon-remove", "click", function() {
                var tabPanelId = $( this ).closest( "li" ).attr( "aria-controls"),
                    tabKey = self.tabsIdMap[tabPanelId];

                if(contrail.checkIfExist(self.tabs[tabKey].tabConfig) && self.tabs[tabKey].tabConfig.removable === true) {
                    self.removeTab(tabKey);
                }
            });
        },

        removeTab: function (tabIndex) {
            var self = this,
                elId = self.attributes.elementId, tabPanelId,
                tabConfig = (contrail.checkIfExist(self.tabs[tabIndex].tabConfig) ? self.tabs[tabIndex].tabConfig : null);
            if($.isArray(tabIndex)) {
                for (var i = 0; i < tabIndex.length; i++) {
                    self.removeTab(tabIndex[i]);
                }
                return;
            }

            tabPanelId = $("#" + elId).find('li:eq(' + tabIndex + ')').attr( "aria-controls");

            $("#" + elId).find('li:eq(' + tabIndex + ')').remove();
            $("#" + tabPanelId).remove();
            $('#' + elId).data('contrailTabs').refresh();

            $.each(self.tabsIdMap, function (tabsIdKey, tabsIdValue) {
                if (tabsIdValue > tabIndex) {
                    self.tabsIdMap[tabsIdKey] = tabsIdValue - 1;
                }
            });

            delete self.tabsIdMap[tabPanelId];
            self.tabs.splice(tabIndex, 1);
            self.tabRendered.splice(tabIndex, 1);

            if (self.tabs.length === 0) {
                $("#" + elId).hide();
            }

            if (tabConfig !== null && contrail.checkIfFunction(tabConfig.onRemoveTab)) {
                tabConfig.onRemoveTab();
            }
        },

        renderTab: function(tabObj, onAllViewsRenderComplete) {
            var self = this,
                elId = self.attributes.elementId,
                validation = self.attributes.validation,
                lockEditingByDefault = self.attributes.lockEditingByDefault,
                modelMap = self.modelMap,
                childElId = tabObj[cowc.KEY_ELEMENT_ID];

            $("#" + elId).show();

            self.renderView4Config(this.$el.find("#" + childElId), this.model, tabObj, validation, lockEditingByDefault, modelMap, onAllViewsRenderComplete);
        },

        renderNewTab: function(elementId, tabViewConfigs, activateTab, modelMap, onAllViewsRenderComplete) {
            var self = this,
                tabLinkTemplate = contrail.getTemplate4Id(cowc.TMPL_TAB_LINK_VIEW),
                tabContentTemplate = contrail.getTemplate4Id(cowc.TMPL_TAB_CONTENT_VIEW),
                tabLength = self.tabs.length;

            self.modelMap = modelMap;

            $.each(tabViewConfigs, function(tabKey, tabValue) {
                if (!contrail.checkIfExist(self.tabsIdMap[tabValue[cowc.KEY_ELEMENT_ID] + '-tab'])) {
                    $('#' + elementId + ' > ul.contrail-tab-link-list').append(tabLinkTemplate([tabValue]));
                    $('#' + elementId).append(tabContentTemplate([tabValue]));
                    $('#' + elementId).data('contrailTabs').refresh();

                    self.tabs.push(tabValue);
                    self.tabsIdMap[tabValue[cowc.KEY_ELEMENT_ID] + '-tab'] = tabLength;
                    if (contrail.checkIfKeyExistInObject(true, tabValue, 'tabConfig.renderOnActivate') && tabValue.tabConfig.renderOnActivate === true) {
                        self.tabRendered.push(false);
                        //TODO - onAllViewsRenderComplete should be called when rendered
                    } else {
                        self.renderTab(tabValue, onAllViewsRenderComplete);
                        self.tabRendered.push(true);
                    }

                    tabLength++;

                    if (activateTab === true) {
                        $('#' + elementId).data('contrailTabs').activateTab(tabLength - 1);
                    } else if (typeof activateTab === 'number') {
                        $('#' + elementId).data('contrailTabs').activateTab(activateTab);
                    }

                } else {
                    $('#' + elementId).data('contrailTabs').activateTab(self.tabsIdMap[tabValue[cowc.KEY_ELEMENT_ID] + '-tab'])
                }
            });
        }
    });

    return TabsView;
});
/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */

define('core-basedir/js/views/WizardView',[
    'underscore',
    'contrail-view'
], function (_, ContrailView) {
    var WizardView = ContrailView.extend({
        render: function () {
            var self = this,
                wizardTempl = contrail.getTemplate4Id(cowc.TMPL_WIZARD_VIEW),
                viewConfig = self.attributes.viewConfig,
                elId = self.attributes.elementId,
                validation = self.attributes.validation,
                lockEditingByDefault = self.attributes.lockEditingByDefault,
                steps;

            self.$el.html(wizardTempl({viewConfig: viewConfig, elementId: elId}));
            steps = viewConfig['steps'];

            $.each(steps, function(stepKey, stepValue){
                var stepElementId = stepValue.elementId;
                self.model.showErrorAttr(stepElementId, false);
                if(stepValue.onInitRender == true) {
                    stepValue.onInitWizard = function(params, onInitCompleteCB) {
                        self.renderView4Config($("#" + stepElementId), self.model, stepValue, validation, lockEditingByDefault, null, function(){
                            if(contrail.checkIfFunction(onInitCompleteCB)) {
                                onInitCompleteCB(params);
                            }
                        });
                    };
                } else {
                    stepValue.onInitFromNext = function (params, onInitCompleteCB) {
                        self.onAllViewsRenderComplete.unsubscribe();
                        self.renderView4Config($("#" + stepElementId), self.model, stepValue, validation, lockEditingByDefault, null, function(){
                            if(contrail.checkIfFunction(onInitCompleteCB)) {
                                onInitCompleteCB(params);
                            }
                        });
                    };
                }
            });

            self.$el.find("#" + elId).contrailWizard({
                headerTag: "h2",
                bodyTag: "section",
                transitionEffect: "slideLeft",
                titleTemplate: '<span class="number">#index#</span><span class="title"> #title#</span>',
                steps: steps,
                params: {
                    model: self.model
                }
            });

            self.$el.parents('.modal-body').css({'padding': '0'});
        }
    });

    return WizardView;
});
define('js/contrail-core-views',[
    'core-basedir/js/views/GridView',
    'core-basedir/js/views/AccordianView',
    'core-basedir/js/views/DetailsView',
    'core-basedir/js/views/DonutChartView',
    'core-basedir/js/views/FormAutoCompleteTextBoxView',
    'core-basedir/js/views/FormButtonView',
    'core-basedir/js/views/FormCheckboxView',
    'core-basedir/js/views/FormCollectionView',
    'core-basedir/js/views/FormComboboxView',
    'core-basedir/js/views/FormCompositeView',
    'core-basedir/js/views/FormDateTimePickerView',
    'core-basedir/js/views/FormDropdownView',
    'core-basedir/js/views/FormEditableGridView',
    'core-basedir/js/views/FormGridView',
    'core-basedir/js/views/FormHierarchicalDropdownView',
    'core-basedir/js/views/FormInputView',
    'core-basedir/js/views/FormMultiselectView',
    'core-basedir/js/views/FormNumericTextboxView',
    'core-basedir/js/views/FormRadioButtonView',
    'core-basedir/js/views/FormTextAreaView',
    'core-basedir/js/views/FormTextView',
    'core-basedir/js/views/GridFooterView',
    'core-basedir/js/views/HeatChartView',
    'core-basedir/js/views/HorizontalBarChartView',
    'core-basedir/js/views/LineBarWithFocusChartView',
    'core-basedir/js/views/LineWithFocusChartView',
    'core-basedir/js/views/LoginWindowView',
    'core-basedir/js/views/MultiBarChartView',
    'core-basedir/js/views/MultiDonutChartView',
    'core-basedir/js/views/NodeConsoleLogsView',
    'core-basedir/js/views/QueryFilterView',
    'core-basedir/js/views/QueryResultGridView',
    'core-basedir/js/views/QueryResultLineChartView',
    'core-basedir/js/views/QuerySelectView',
    'core-basedir/js/views/QueryWhereView',
    'core-basedir/js/views/SparklineView',
    'core-basedir/js/views/TabsView',
    'core-basedir/js/views/WizardView',
        ], function() {});





