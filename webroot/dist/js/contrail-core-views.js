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
    'core-basedir/js/views/GridFooterView'
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
                                // console.log('grid:sort',value1,value2,result);
                                return result;
                            }
                        }
                        // console.log('grid:sort',value1,value2,result);
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
    'contrail-view'
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
    'contrail-view'
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
    'contrail-list-model'
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
    'contrail-list-model'
], function (_, ContrailView, LineWithFocusChartModel, ContrailListModel) {
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
    'contrail-list-model'
], function (_, ContrailView, MultiBarChartModel, ContrailListModel) {
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
    'contrail-list-model'
], function (_, ContrailView, MultiDonutChartModel, ContrailListModel) {
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

define('query-form-view',[
    'underscore',
    'contrail-view',
    'knockback'
], function (_, ContrailView, Knockback) {

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
    'query-and-model'
], function (_, Backbone, Knockout, ContrailModel, QueryOrModel, QueryAndModel) {
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
    'core-basedir/js/models/NodeConsoleLogsModel'
], function (_, QueryFormView, Knockback, NodeConsoleLogsModel) {
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

define('core-basedir/js/views/QueryResultGridView',[
    'underscore',
    'contrail-view',
    'contrail-list-model'
], function (_, ContrailView, ContrailListModel) {

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
/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */

define('core-basedir/js/models/ScatterChartModel',[
    'underscore'
], function (_) {
    var ScatterChartModel = function(chartData, chartOptions) {
        var chartModel = nv.models.scatterChart()
            .showDistX(false)
            .showDistY(false)
            // .sizeDomain([4,14])
            // .sizeRange([4,14])
            .sizeDomain([0.7,2])
            // .sizeRange([200,1500])
            .tooltipXContent(null)
            .tooltipYContent(null)
            .showTooltipLines(false)
            .tooltipContent(chartOptions['tooltipFn']);

        if (chartOptions['tooltipRenderedFn'] != null)
            chartModel.tooltipRenderedFn(chartOptions['tooltipRenderedFn']);
        if (chartOptions['forceX'] != null)
            chartModel.forceX(chartOptions['forceX']);
        if (chartOptions['forceY'] != null)
            chartModel.forceY(chartOptions['forceY']);
        if (chartOptions['seriesMap'] != null)
            chartModel.seriesMap(chartOptions['seriesMap']);
        if (chartOptions['xPositive'] != null && chartModel.scatter != null)
            chartModel.scatter.xPositive(chartOptions['xPositive']);
        if (chartOptions['yPositive'] != null && chartModel.scatter != null)
            chartModel.scatter.yPositive(chartOptions['yPositive']);
        if (chartOptions['addDomainBuffer'] != null && chartModel.scatter != null)
            chartModel.scatter.addDomainBuffer(chartOptions['addDomainBuffer']);
        if (chartOptions['useVoronoi'] != null && chartModel.scatter != null)
            chartModel.scatter.useVoronoi(chartOptions['useVoronoi']);
        if (chartOptions['useSizeAsRadius'] != null && chartModel.scatter != null)
            chartModel.scatter.useSizeAsRadius(chartOptions['useSizeAsRadius']);
        if (chartOptions['sizeDomain'] != null && chartModel.scatter != null)
            chartModel.scatter.sizeDomain(chartOptions['sizeDomain']);
        if (chartOptions['sizeRange'] != null && chartModel.scatter != null)
            chartModel.scatter.sizeRange(chartOptions['sizeRange']);

        //If more than one category is displayed,enable showLegend
        if (chartData.length == 1 || chartOptions['showLegend'] == false) {
            chartModel.showLegend(false);
        }

        chartModel.xAxis.tickFormat(chartOptions['xLblFormat']);
        chartModel.yAxis.tickFormat(chartOptions['yLblFormat']);
        chartModel.xAxis.showMaxMin(false);
        chartModel.yAxis.showMaxMin(false);
        chartModel.yAxis.axisLabel(chartOptions['yLbl']);
        chartModel.xAxis.axisLabel(chartOptions['xLbl']);
        chartModel.yAxis.ticks(3);

        chartModel.dispatch.on('stateChange', chartOptions['stateChangeFunction']);
        chartModel.legend.dispatch.on('legendDblclick', function(e) { 
            console.info('legendDblclick');
            d3.event.stopPropagation();
            });
        chartModel.scatter.dispatch.on('elementClick', chartOptions['elementClickFunction']);
        chartModel.scatter.dispatch.on('elementDblClick', chartOptions['elementDoubleClickFunction']);
        chartModel.scatter.dispatch.on('elementMouseout', chartOptions['elementMouseoutFn']);
        chartModel.scatter.dispatch.on('elementMouseover', chartOptions['elementMouseoverFn']);

        chartModel.scatter.dispatch.on('elementMouseout.tooltip', chartOptions['elementMouseoutFn']);

        return chartModel;
    };

    return ScatterChartModel;
});

/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */

define('core-basedir/js/views/ScatterChartView',[
    'underscore',
    'contrail-view',
    'core-basedir/js/models/ScatterChartModel',
    'contrail-list-model'
], function (_, ContrailView, ScatterChartModel, ContrailListModel) {
    var ScatterChartView = ContrailView.extend({
        render: function () {
            var loadingSpinnerTemplate = contrail.getTemplate4Id(cowc.TMPL_LOADING_SPINNER),
                viewConfig = this.attributes.viewConfig,
                ajaxConfig = viewConfig['ajaxConfig'],
                chartOptions = viewConfig['chartOptions'],
                self = this, deferredObj = $.Deferred(),
                selector = $(self.$el);

            $(selector).append(loadingSpinnerTemplate);

            if(self.model == null && viewConfig['modelConfig'] != null) {
                self.model = new ContrailListModel(viewConfig['modelConfig']);
            }

            if(self.model != null) {
                if(self.model.loadedFromCache || !(self.model.isRequestInProgress())) {
                    self.renderChart(selector, viewConfig, self.model);
                }

                self.model.onAllRequestsComplete.subscribe(function() {
                    self.renderChart(selector, viewConfig, self.model);
                });

                if(viewConfig.loadChartInChunks) {
                    self.model.onDataUpdate.subscribe(function() {
                        if(!this.isMyRenderInProgress) {
                            //TODO: We should render chart less often
                            self.renderChart(selector, viewConfig, self.model);
                        }
                    });
                }
            }
        },

        renderChart: function (selector, viewConfig, dataListModel) {
            this.isMyRenderInProgress = true;

            var data = dataListModel.getFilteredItems(),
                error = dataListModel.error,
                //Pass it as false if don't want to reintialize the chart on data update
                reInitialize = true,
                chartViewConfig, chartData, chartModel, chartOptions;

            if (contrail.checkIfFunction(viewConfig['parseFn'])) {
                data = viewConfig['parseFn'](data);
            }

            chartViewConfig = getChartViewConfig(selector, data);
            chartData = chartViewConfig['chartData'];
            chartOptions = chartViewConfig['chartOptions'];
            reInitialize = ifNull(viewConfig['reInitialize'],true);

            if(reInitialize == false) {
                if($(selector).data('chart') == null) {
                    this.chartModel = new ScatterChartModel(chartData, chartOptions);
                    chartModel = this.chartModel;
                    $(selector).data('chart', chartModel);
                } else {
                    chartModel = $(selector).data('chart');
                }
            } else {
                this.chartModel = new ScatterChartModel(chartData, chartOptions);
                chartModel = this.chartModel;
                $(selector).data('chart', chartModel);
            }

            if(dataListModel.isRequestInProgress()) {
                chartModel.noData(cowm.DATA_FETCHING);
            } else if(chartModel['noDataMessage']) {
                chartModel.noData(chartModel['noDataMessage']);
            } else if (error) {
                chartModel.noData(cowm.DATA_ERROR);
            }

            if ($(selector).find('svg').length == 0) {
                $(selector).append('<svg></svg>');
            }
            //Add color filter
            if(chartOptions['isBucketize']) {
                if($(selector).find('.color-selection').length == 0) {
                    $(selector).prepend($('<div/>', {
                            class: 'chart-settings'
                        }));
                    $(selector).find('.chart-settings').append(contrail.getTemplate4Id('color-selection'));
                }
            }
            function refreshScatterChart(selector,chartData,chartModel) {
                d3.select($(selector)[0]).select('svg').datum(chartData).call(chartModel);
                // if(isScatterChartInitialized(selector)) {
                //     d3.select($(selector)[0]).select('svg').datum(chartData);
                //     chartModel.update();
                // } else {
                //     d3.select($(selector)[0]).select('svg').datum(chartData).call(chartModel);
                // }
            }
            //If scatterChart not initialized
            if(!isScatterChartInitialized(selector)) {
                addSelectorClickHandlers(selector,chartOptions,chartModel);
                nv.addGraph(function() {
                    if (!($(selector).is(':visible'))) {
                        $(selector).find('svg').bind("refresh", function () {
                            refreshScatterChart(selector,chartData,chartModel);
                        });
                    } else {
                        refreshScatterChart(selector,chartData,chartModel);
                    }
                    return chartModel;
                    },function() {
                        if(typeof(chartOptions['onInitializingScatterChart']) == 'function') {
                            chartOptions['onInitializingScatterChart']();
                        }
                        $(selector).data('initialized',true);
                    });
            } else {
                if (!($(selector).is(':visible'))) {
                    $(selector).find('svg').bind("refresh", function () {
                        refreshScatterChart(selector,chartData,chartModel);
                        // d3.select($(selector)[0]).select('svg').datum(chartData).call(chartModel);
                    });
                } else {
                    refreshScatterChart(selector,chartData,chartModel);
                    // d3.select($(selector)[0]).select('svg').datum(chartData).call(chartModel);
                }
            }

            nv.utils.windowResize(function () {
                chUtils.updateChartOnResize(selector, chartModel);
            });
            //Seems like in d3 chart renders with some delay so this deferred object helps in that situation, which resolves once the chart is rendered
            if (chartOptions['deferredObj'] != null) {
                chartOptions['deferredObj'].resolve();
            }

            $(selector).find('.loading-spinner').remove();
            this.isMyRenderInProgress = false;
        }
    });

    function getChartViewConfig(selector, initResponse) {
        var chartOptions = ifNull(initResponse['chartOptions'], {}),
            chartData;

        var origData = $.extend(true,{},initResponse);
        //TODO - move values to constants
        var xLbl = ifNull(initResponse['xLbl'], 'CPU (%)'),
            yLbl = ifNull(initResponse['yLbl'], 'Memory (MB)');
        var xLblFormat = ifNull(initResponse['xLblFormat'], d3.format('.02f')),
            yLblFormat = ifNull(initResponse['yLblFormat'], d3.format());
        var yDataType = ifNull(initResponse['yDataType'], '');
        var tooltipTimeoutId;

        if (initResponse['yLblFormat'] == null) {
            yLblFormat = function (y) {
                return parseFloat(d3.format('.02f')(y)).toString();
            };
        }

        if ($.inArray(ifNull(initResponse['title'], ''), ['vRouters', 'Analytic Nodes', 'Config Nodes', 'Control Nodes']) > -1) {
            initResponse['forceX'] = [0, 0.15];
            xLblFormat = ifNull(initResponse['xLblFormat'], d3.format('.02f'));
            //yLblFormat = ifNull(data['xLblFormat'],d3.format('.02f'));
        }
        if (initResponse['d'] != null)
            chartData = initResponse['d'];

        //Merge the data values array if there are multiple categories plotted in chart, to get min/max values
        var dValues = $.map(chartData, function (obj, idx) {
            return obj['values'];
        });
        dValues = flattenList(dValues);

        //copying the xfield and yfield values to x and y in charts data
        $.each(dValues,function(idx,obj){
                if(obj['xField'] != null) {
                    obj['x'] = obj[obj['xField']];
                }
                if(obj['yField'] != null) {
                    obj['y'] = obj[obj['yField']];
                }
            });
        var totalBucketizedNodes = 0;
        isBucketize = (chartOptions['isBucketize'])? true: false;
        if(isBucketize){
            chartData = doBucketization(chartData,chartOptions);
            totalBucketizedNodes = getTotalBucketizedNodes(chartData);
            //Merge the data values array if there are multiple categories plotted in chart, to get min/max values
            dValues = $.map(chartData,function(obj,idx) {
                return obj['values'];
            });
        }



        //Decide the best unit to display in y-axis (B/KB/MB/GB/..) and convert the y-axis values to that scale
        if (yDataType == 'bytes') {
            var result = formatByteAxis(chartData);
            chartData = result['data'];
            yLbl += result['yLbl'];
        }
        chartOptions['multiTooltip'] = false; 
        chartOptions['scatterOverlapBubbles'] = false;
        chartOptions['xLbl'] = xLbl;
        chartOptions['yLbl'] = yLbl;
        chartOptions['xLblFormat'] = xLblFormat;
        chartOptions['yLblFormat'] = yLblFormat;
        chartOptions['forceX'] = initResponse['forceX'];
        chartOptions['forceY'] = initResponse['forceY'];
        var seriesType = {};
        for (var i = 0; i < chartData.length; i++) {
            var values = [];
            if (chartData[i]['values'].length > 0)
                seriesType[chartData[i]['values'][0]['type']] = i;
            $.each(chartData[i]['values'], function (idx, obj) {
                obj['multiTooltip'] = chartOptions['multiTooltip'];
                obj['fqName'] = initResponse['fqName'];
                values.push(obj);
            })
            chartData[i]['values'] = values;
        }
        //In case of multi-series,seriesMap is maintained to filter out the nodes from disabled series while showing overlapped nodes
        chartOptions['seriesMap'] = seriesType;
        var tooltipFn = chartOptions['tooltipFn'];
        var bucketTooltipFn = chartOptions['bucketTooltipFn'];
        chartOptions['tooltipFn'] = function (e, x, y, chart) {
            return constructScatterChartTooltip(e, x, y, chart, tooltipFn,bucketTooltipFn);
        };

        chartOptions['tooltipRenderedFn'] = function (tooltipContainer, e, chart) {
            var tooltipData = e.point,
                overlappedNodes = tooltipData['overlappedNodes'];

            initTooltipEvents(tooltipContainer, tooltipFn, tooltipData, overlappedNodes);
        }

        if (chartOptions['scatterOverlapBubbles']) {
            chartData = scatterOverlapBubbles(chartData);
        }


        chartOptions['stateChangeFunction'] = function (e) {
            //nv.log('New State:', JSON.stringify(e));
        };

        chartOptions['elementClickFunction'] = function (e) {
            // d3.event.stopPropagation();
            if(e['point']['isBucket']){
                zoomIn(e,selector);
            } else if(typeof(chartOptions['clickFn']) == 'function') {
                chartOptions['clickFn'](e['point']);
            } else {
                processDrillDownForNodes(e);
            }
        };

        chartOptions['elementDoubleClickFunction'] = function(e) {
            d3.event.stopPropagation();
        };

        chartOptions['elementDblClickFunction'] = function (e) {
            zoomOut(selector);
        };

        /*
         * chartOptions['elementMouseoutFn'] = function (e) {
         *     //In case of overlapped tooltip,clean-up the tooltip if tooltip containter doesn't get mouse foucs within 1500ms
         *     if(e['point']['overlappedNodes'] != undefined && e['point']['overlappedNodes'].length > 1 && e['point']['isBucket'] != true) {
         *         if(tooltipTimeoutId != undefined)
         *             clearTimeout(tooltipTimeoutId);
         *         tooltipTimeoutId = setTimeout(function(){
         *             tooltipTimeoutId = undefined;  
         *             if(hoveredOnTooltip != true){
         *                 nv.tooltip.cleanup();
         *             }
         *             },1500);    
         *     } else
         *         nv.tooltip.cleanup();
         * };
         */
        chartOptions['elementMouseoverFn'] = function(e) {
            if(tooltipTimeoutId != undefined)
                clearTimeout(tooltipTimeoutId);
        }
        if (initResponse['hideLoadingIcon'] != false)
            $(this).parents('.widget-box').find('.icon-spinner').hide();
        chartOptions['useVoronoi'] = false;

        //All tweaks related to bubble sizes
        function normalizeBubbleSizes(chartData) {
            //Merge the data values array if there are multiple categories plotted in chart, to get min/max values
            var dValues = $.map(chartData,function(obj,idx) {
                return obj['values'];
            });
            //If the axis is bytes, check the max and min and decide the scale KB/MB/GB
            //Set size domain
            var sizeMinMax = getBubbleSizeRange(dValues);
            chartOptions['sizeMinMax'] = sizeMinMax;

            logMessage('scatterChart', 'sizeMinMax', sizeMinMax);
            var d3SizeScale; 
            if(chartOptions['isBucketize']) {
                chartOptions['sizeDomain'] = [4,14];
                chartOptions['sizeRange'] = [4,14];
                if(sizeMinMax[0] != sizeMinMax[1]) {
                    d3SizeScale = d3.scale.quantize().domain(chartOptions['sizeMinMax']).range([6,7,9,10,11,12]);
                }
            }
            else
                d3SizeScale = d3.scale.linear().range([6,6]).domain(chartOptions['sizeMinMax']);
            if(isBucketize) {
                $.each(chartData,function(idx,currSeries) {
                    currSeries['values'] = $.each(currSeries['values'],function(idx,obj) {
                            obj = $.extend(obj, {
                                multiTooltip: true,
                                size: (obj['size'] == 0) ? 6 : d3SizeScale(obj['size'])
                            });
                        });
                });
            }
        }
        normalizeBubbleSizes(chartData);

        if(isBucketize) {
            //Bind drag event once scatterChart initialized
            function onInitializingScatterChart() {
                addScatterChartDragHandler(selector);
            }
            chartOptions['onInitializingScatterChart'] = onInitializingScatterChart;
        }

        if(!isScatterChartInitialized(selector)) {
            if (initResponse['loadedDeferredObj'] != null) {
                initResponse['loadedDeferredObj'].fail(function (errObj) {
                    if (errObj['errTxt'] != null && errObj['errTxt'] != 'abort') {
                        showMessageInChart({
                            selector: $(selector),
                            chartObj: $(selector).data('chart'),
                            xLbl: chartOptions['xLbl'],
                            yLbl: chartOptions['yLbl'],
                            msg: 'Error in fetching details',
                            type: 'bubblechart'
                                });
                            }
                        });
            }
            if(chartOptions['deferredObj'] != null && chartOptions['deferredObj'].state() == 'pending') {
                chartOptions['deferredObj'].done(function(){
                    var settings = [];
                    if(chartOptions['xAxisParams'] != null) { 
                        settings.push({id:'xAxisParams',lbl:'X-Axis'});
                    }
                    if(chartOptions['yAxisParams'] != null) {
                        settings.push({id:'yAxisParams',lbl:'Y-Axis'});
                    }
                    if(chartOptions['showSettings'] && $(selector).parent('div').find('.chart-settings').length == 0) {
                        $(selector).parent('div').prepend(contrail.getTemplate4Id('chart-settings')(settings));
                        showAxisParams(selector,settings);
                    }
                });
            }
            var chartid = $(selector).attr('id');
            $("#"+ chartid).data('origData',origData);
        } else {
            var chart = $(selector).data('chart');
            chart = setChartOptions(chart,chartOptions);
            d3.select($(selector)[0]).select('svg').datum(chartData);
            if(chart.update != null)
                chart.update();
        }
        var chartid = $(selector).attr('id');
        if (initResponse['widgetBoxId'] != null)
            endWidgetLoading(initResponse['widgetBoxId']);

        return {selector: selector, chartData: chartData, chartOptions: chartOptions};
    };

    function addSelectorClickHandlers(selector,chartOptions,chartModel) {
        d3.select($(selector).find('svg')[0]).on('dblclick',
        function() {
            chartOptions['elementDblClickFunction']();
        });

        /****
        * Selection handler for color filter in chart settings panel
        ****/
        $(selector).on('click','.chart-settings .color-selection .circle',function() {
            var currElem = $(this);
            $(this).toggleClass('filled');

            var colorFilterFunc = getColorFilterFn($(this).parents('.color-selection'));

            if(chartOptions['crossFilter'] != null) {
                filterUsingGlobalCrossFilter(chartOptions['crossFilter'],null,null,colorFilterFunc);
            }
        });
    }

    function addScatterChartDragHandler(selector) {
        //Will be set to true on pressing "Esc" key
        var cancelDragEvent;

        //drag support
        d3.select($(selector)[0]).select('svg').call(dragSrc
            .on('dragstart',function(d,i) {
                console.info('dragstart');
                d.dx = 0;
                d.dy = 0;
            })
            .on("drag", function(d, i){
                cancelDragEvent = false;
                d.x  = d3.event.x;
                d.y = d3.event.y;
                if(d.dx == null) {
                    d.dx = 0
                }   
                if(d.dy == null) {
                    d.dy = 0
                }                     
                d.dx += d3.event.dx;
                d.dy -= d3.event.dy;
                if(d3.select($(selector)[0]).select('#rect1')[0][0] != null) {
                    $('#rect1').remove();
                }
                var offsetX = d.offsetX, offsetY = d.offsetY, xMirror = 1 , yMirror = 1;                     
                //If dragging left-side
                if(d.dx < 0) {
                    offsetX = -d.offsetX;
                    xMirror = -1;
                }
                if(d.dy > 0) {
                    offsetY = -d.offsetY;
                    yMirror = -1;
                }                   
                
                d3.select($(selector)[0]).select('svg').append('rect').attr('id','rect1')
                .attr('x', offsetX)
                .attr('y',offsetY)
                .attr('width',Math.abs(d.dx))
                .attr('height',Math.abs(d.dy))
                .attr('style',"stroke:lightgrey;stroke-width:2;fill:lightgrey;fill-opacity:0.5;")
                .attr('transform', 'scale(' + xMirror + ',' + yMirror +')');
            })
            .on("dragend", function(d,i){
                    if(d3.select($(selector)[0]).select('#rect1')[0][0] != null) {
                        $('#rect1').remove();
                    }                
                    if(cancelDragEvent == true) {
                        cancelDragEvent = false;
                        $('#rect1').remove();
                        return;
                    }
                    if(d.dx == 0 && d.dy == 0) {
                        $('#rect1').remove();
                        return;
                    }
                    d.offsetX = d.offsetX - 75;
                    d.offsetY = d.offsetY - 30;
                    var minMaxX = [];
                    var xValue1 = $(selector).data('chart').scatter.xScale().invert(d.offsetX);
                    var xValue2 = $(selector).data('chart').scatter.xScale().invert(d.offsetX + d.dx);
                    minMaxX[0] = Math.min(xValue1, xValue2);
                    minMaxX[1] = Math.max(xValue1, xValue2);
                    var minMaxY = [];
                    var yValue1 = $(selector).data('chart').scatter.yScale().invert(d.offsetY);
                    var yValue2 = $(selector).data('chart').scatter.yScale().invert(d.offsetY - d.dy);
                    minMaxY[0] = Math.min(yValue1, yValue2);
                    minMaxY[1] = Math.max(yValue1, yValue2);
                    //adjust min and max values to include missed bubbles
                    var combinedValues = [];
                    $.each(d,function(idx,obj){
                        $.each(obj.values,function(currIdx,item){
                            //Include all nodes whose center position falls within the dragged region
                            if(item.x >= minMaxX[0] && item.x <= minMaxX[1]
                                && item.y >= minMaxY[0] && item.y <= minMaxY[1]) {
                                combinedValues.push(item);
                            }
                        });
                    });
                    //If there is no node within dragged selection,ignore
                    if(combinedValues.length == 0) {
                        return;
                    }
                    var selectedNames = [];
                    $.each(combinedValues,function(idx,obj) {
                        if(obj['isBucket']) {
                            $.each(obj['children'],function(idx,children) {
                                selectedNames.push(children['name']);
                            });
                        } else {
                            selectedNames.push(obj['name']);
                        }
                    });
                    d.dx = 0;
                    d.dy = 0;

                    /*
                     * //To align drag selection with bucket min/max values
                     * var finalMinX = d3.extent(combinedValues,function(obj){
                     *     if(obj['isBucket']) 
                     *         return obj['minMaxX'][0]; 
                     *     else 
                     *         return ifNull(obj['origX'],obj['x']);
                     * });
                     * minMaxX[0] = finalMinX[0];
                     * var finalMaxX = d3.extent(combinedValues,function(obj){
                     *     if(obj['isBucket']) 
                     *         return obj['minMaxX'][1];
                     *     else 
                     *         return  ifNull(obj['origX'],obj['x']);
                     * });
                     * minMaxX[1] = finalMaxX[1]; 
                     * var finalMinY = d3.extent(combinedValues,function(obj){
                     *     if(obj['isBucket']) 
                     *         return obj['minMaxY'][0]; 
                     *     else 
                     *         return  ifNull(obj['origY'],obj['y']);
                     * });
                     * minMaxY[0] = finalMinY[0];
                     * var finalMaxY = d3.extent(combinedValues,function(obj){
                     *     if(obj['isBucket']) 
                     *         return obj['minMaxY'][1]; 
                     *     else 
                     *         return  ifNull(obj['origY'],obj['y']);
                     * });
                     * minMaxY[1] = finalMaxY[1];
                     * zoomIn({point: {minMaxX:minMaxX,minMaxY:minMaxY}},selector);
                     */
                    zoomIn({selectedNames: selectedNames},selector);
            })
        ).on('mousedown', function(d){
            d.offsetX = d3.event.offsetX;
            d.offsetY = d3.event.offsetY;
        })
        d3.select('body').on('keyup', function(d) {
            if(d3.event.keyCode == 27) cancelDragEvent = true;
        });
    }
    /*
     * Start: Bucketization functions
     */
    /** Given node obj to disperse use the x and y values and size to randomly add minute values 
    * to x and y so that the nodes appear dispersed instead of a single node. */
    function disperseRandomly(nodes,maxVariation){
        for(var i=0;i < nodes.length; i++){
            var x = $.isNumeric(nodes[i]['x']) ? nodes[i]['x'] : 0;
            var y = $.isNumeric(nodes[i]['y']) ? nodes[i]['y'] : 0;
            //In case of random scatter,assign size as 1 as each node is plotted independently
            // nodes[i]['size'] = 1;
            var newX = getRandomValue(x - (x* maxVariation), x + (x* maxVariation)); 
            var newY = getRandomValue(y - (y* maxVariation), y + (y* maxVariation));
            nodes[i]['origX'] = x;
            nodes[i]['origY'] = y;
            nodes[i]['x'] = newX;
            nodes[i]['y'] = newY;
        }
        return nodes;
    }

    function disperseNodes(obj){
        var retNodes = []
        if(obj != null && obj['isBucket']){
            retNodes = obj['children'];
            retNodes = disperseRandomly(retNodes,0.05);
        }
        return retNodes;
    }

    function filterAndDisperseNodes(data,minMaxX,minMaxY){   
        var ret = data;
        ret = disperseRandomly(data,0.05);
        return ret;
    }

    function doBucketization(data,chartOptions){
        var data = $.extend(true,[],data);
        var minMax, minMaxX, minMaxY, parentMinMax, currLevel, maxBucketizeLevel, bucketsPerAxis;
        var bucketOptions = chartOptions.bucketOptions;
        if(chartOptions.bucketOptions != null) {
            currLevel = bucketOptions.currLevel;
            minMax = bucketOptions.minMax;
            //maxBucketizeLevel = bucketOptions.maxBucketizeLevel;
            parentMinMax = bucketOptions.parentMinMax;
            //bucketsPerAxis = bucketOptions.bucketsPerAxis;
        } else {
            currLevel = 0;
        }

        maxBucketizeLevel = (!getCookie(BUCKETIZE_LEVEL_COOKIE))? defaultMaxBucketizeLevel : parseInt(getCookie(BUCKETIZE_LEVEL_COOKIE));
        bucketsPerAxis = (!getCookie(BUCKETS_PER_AXIS_COOKIE))? defaultBucketsPerAxis : parseInt(getCookie(BUCKETS_PER_AXIS_COOKIE));

        if (data != null) {
            var combinedValues = concatenateDataFromMultipleSeries(data);
            minMaxX = d3.extent(combinedValues,function(obj){
                return obj['x'];
            });
            minMaxY = d3.extent(combinedValues,function(obj){
                return obj['y'];
            });
            //set forceX and  forceY to fix the axes boundaries
            chartOptions.forceX = minMaxX;
            chartOptions.forceY = minMaxY;        
            if(parentMinMax == null){
                parentMinMax = [];
            }
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
                // chartOptions['addDomainBuffer'] = false;
                //Max level of bucketization has reached now just disperse the nodes randomly in space
                for(var i = 0;i < data.length; i++ ) {
                    data[i]['values'] = filterAndDisperseNodes(data[i]['values'],minMaxX,minMaxY); 
                }
            } else {
                /* Bucketize based on d3Scale */
                var xBucketScale = d3.scale.quantize().domain(minMaxX).range(d3.range(1,bucketsPerAxis));
                var yBucketScale = d3.scale.quantize().domain(minMaxY).range(d3.range(1,bucketsPerAxis));
                $.each(data,function(idx,currSeries) {
                    var buckets = {};
                    //Group nodes into buckets
                        $.each(currSeries['values'],function(idx,obj) {
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
                    data[idx]['values'] = [];
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
                                    obj['x'] = avgX;
                                    obj['y'] = avgY;
                                    if(typeof(chartOptions['bubbleSizeFn']) == 'function') {
                                        obj['size'] = chartOptions['bubbleSizeFn'](buckets[x][y]);
                                    } else {
                                        obj['size'] = buckets[x][y].length;
                                    }
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
                                    obj['clickFn'] = 'processBucket';
                                    obj['minMaxX'] = d3.extent(buckets[x][y],function(obj)  {
                                        return obj['x'];
                                    });
                                    obj['minMaxY'] = d3.extent(buckets[x][y],function(obj) {
                                        return obj['y'];
                                    });

                                    obj['children'] = buckets[x][y];
                                    data[idx]['values'].push(obj);
                                } else {
                                    nonXYNodes = nonXYNodes.concat(buckets[x][y]);
                                }
                            }
                        });
                    });
                    //Nodes with non-x/y values
                    if(nonXYNodes.length > 0) {
                            data[idx]['values'].push({
                            size:typeof(chartOptions['bubbleSizeFn']) == 'function' ? chartOptions['bubbleSizeFn'](nonXYNodes) : nonXYNodes.length,
                            color:nonXYNodes[0]['color'],
                            stroke: 'black',
                            isBucket: true,
                            children:nonXYNodes
                        });
                    }
                });
            }
        }
        return data;
    }

    /** Counts the total no. of nodes including the nodes in the buckets */
    function getTotalBucketizedNodes(d) {
        var totalBucketizedNodes = 0;
        $.each(concatenateDataFromMultipleSeries(d),function(j,obj){
            if(obj['isBucket']){
                // add the count if its a bucket
                totalBucketizedNodes += obj['size'];
            } else {
                // add 1 if its a single node
                totalBucketizedNodes += 1;
            }
        });
        return totalBucketizedNodes;
    }
    /*
     * End: Bucketization fucntions
     */


    var initTooltipEvents = function (tooltipContainer, tooltipFn, tooltipData, overlappedNodes) {
        var overlappedElementsDropdownElement = null

        $(tooltipContainer).css('pointer-events', 'all');
        $(tooltipContainer).addClass('nvtooltip-popover');

        if (overlappedNodes != undefined && overlappedNodes.length > 1) {
            var overlappedElementData = $.map(overlappedNodes, function(nodeValue, nodeKey) {
                if (tooltipData.name != nodeValue.name) {
                    return {id: nodeKey, text: nodeValue.name}
                }
                return null;
            });

            $(tooltipContainer).find('.popover-tooltip-footer').append('<div class="overlapped-elements-dropdown"></div>')
            overlappedElementsDropdownElement = $(tooltipContainer).find('.overlapped-elements-dropdown');

            overlappedElementsDropdownElement.contrailDropdown({
                dataTextField: 'text',
                dataValueField: 'id',
                placeholder: 'View more (' + overlappedElementData.length + ')',
                defaultValueId: -1,
                dropdownCssClass: 'min-width-150',
                data: overlappedElementData,
                change: function(e) {
                    var selectedNodeKey = e.added.id,
                        selectedNodeData = overlappedNodes[selectedNodeKey];

                    $(tooltipContainer).html(generateTooltipHTML(tooltipFn(selectedNodeData)));
                    initTooltipEvents(tooltipContainer, tooltipFn, selectedNodeData, overlappedNodes);
                }
            });
        }

        $(tooltipContainer).find('.popover').find('.btn')
            .off('click')
            .on('click', function() {
                var actionKey = $(this).data('action'),
                    tooltipConfig = tooltipFn(tooltipData),
                    actionCallback = tooltipConfig.content.actions[actionKey].callback;

                if(contrail.checkIfExist(overlappedElementsDropdownElement) && contrail.checkIfExist(overlappedElementsDropdownElement.data('contrailDropdown'))) {
                    overlappedElementsDropdownElement.data('contrailDropdown').destroy();
                }

                actionCallback(tooltipData);
            });

        $(tooltipContainer).find('.popover-remove')
            .off('click')
            .on('click', function(e) {
                if(contrail.checkIfExist(overlappedElementsDropdownElement) && contrail.checkIfExist(overlappedElementsDropdownElement.data('contrailDropdown'))) {
                    overlappedElementsDropdownElement.data('contrailDropdown').destroy();
                }
                nv.tooltip.cleanup();
            });

        $(document)
            .off('click', onDocumentClickHandler)
            .on('click', onDocumentClickHandler);

        $(window).on('popstate', function (event) {
            nv.tooltip.cleanup();
        });
    };

    var onDocumentClickHandler = function(e) {
        if(!$(e.target).closest('.nvtooltip').length) {
            nv.tooltip.cleanup();

        }
    };

    var constructScatterChartTooltip = function(e, x, y, chart, tooltipFormatFn, bucketTooltipFn, selector) {
        var tooltipContents = [],
            overlappedNodes = getOverlappedNodes(e, chart, selector).reverse();

        e['point']['overlappedNodes'] = overlappedNodes;
        if(e['point']['isBucket']) {
            if(typeof(bucketTooltipFn) == "function"){
                tooltipContents = bucketTooltipFn(e['point']);
            }
        } else if(contrail.checkIfFunction(tooltipFormatFn)) {
            tooltipContents = tooltipFormatFn(e['point']);
        }
        //Format the alerts to display in tooltip
        $.each(ifNull(e['point']['alerts'],[]),function(idx,obj) {
            if(obj['tooltipAlert'] != false) {
                if(tooltipContents['content'] != null && tooltipContents['content']['info'] != null) {
                    tooltipContents['content']['info'].push({label:ifNull(obj['tooltipLbl'],'Events'),value:obj['msg']});
                } else {
                    tooltipContents.push({label:ifNull(obj['tooltipLbl'],'Events'),value:obj['msg']});
                }
            }
        });
        return generateTooltipHTML(tooltipContents);
    };

    var getOverlappedNodes = function(e, chart, selector){
        var currentNode = e.point,
            series = e.series,
            overlappedNodes = [],
            buffer = 1.5, //In percent
            currentX = currentNode.x,
            currentY = currentNode.y,
            totalSeries = [],
            xDiff = chart.xAxis.domain()[1] - chart.xAxis.domain()[0],
            yDiff = chart.yAxis.domain()[1] - chart.yAxis.domain()[0];

        $.each(series, function(seriesKey, seriesValue) {
            $.merge(totalSeries, seriesValue.values);
        });

        $.each(totalSeries, function(totalSeriesKey, totalSeriesValue) {
            if((Math.abs(currentX - totalSeriesValue.x) / xDiff) * 100 <= buffer && (Math.abs(currentY - totalSeriesValue.y) / yDiff) * 100 <= buffer) {
                overlappedNodes.push(totalSeriesValue);
            }
        });

        return overlappedNodes;
    };

    var generateTooltipHTML = function(tooltipConfig) {
        var tooltipElementTemplate = contrail.getTemplate4Id(cowc.TMPL_ELEMENT_TOOLTIP),
            tooltipElementTitleTemplate = contrail.getTemplate4Id(cowc.TMPL_ELEMENT_TOOLTIP_TITLE),
            tooltipElementContentTemplate = contrail.getTemplate4Id(cowc.TMPL_ELEMENT_TOOLTIP_CONTENT),
            tooltipElementObj, tooltipElementTitleObj, tooltipElementContentObj;

        tooltipConfig = $.extend(true, {}, cowc.DEFAULT_CONFIG_ELEMENT_TOOLTIP, tooltipConfig);

        tooltipElementObj = $(tooltipElementTemplate(tooltipConfig)),
        tooltipElementTitleObj = $(tooltipElementTitleTemplate(tooltipConfig.title)),
        tooltipElementContentObj = $(tooltipElementContentTemplate(tooltipConfig.content));

        tooltipElementObj.find('.popover-title').append(tooltipElementTitleObj);
        tooltipElementObj.find('.popover-content').append(tooltipElementContentObj);

        return tooltipElementObj.prop('outerHTML');
    };

    return ScatterChartView;
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

define('js/contrail-core-views',[
    'core-basedir/js/views/GridView',
    'core-basedir/js/views/AccordianView',
    'core-basedir/js/views/BarChartInfoView',
    'core-basedir/js/views/BreadcrumbDropdownView',
    'core-basedir/js/views/BreadcrumbTextView',
    'core-basedir/js/views/ChartView',
    'core-basedir/js/views/ControlPanelView',
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
    'core-basedir/js/views/InfoboxesView',
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
    'core-basedir/js/views/ScatterChartView',
    'core-basedir/js/views/SectionView',
    'core-basedir/js/views/SparklineView',
    'core-basedir/js/views/TabsView',
    'core-basedir/js/views/WidgetView',
    'core-basedir/js/views/WizardView',
    'core-basedir/js/views/ZoomScatterChartView'
        ], function() {});





