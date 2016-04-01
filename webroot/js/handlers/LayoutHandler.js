/*
 * Copyright (c) 2015 Juniper Networks, Inc. All rights reserved.
 */

define(['underscore', 'menu-handler', 'content-handler'], function (_, MenuHandler, ContentHandler) {
    var LayoutHandler = function () {
        var self = this;

        //Don't escape ":[]" characters while pushing state via bbq
        $.param.fragment.noEscape(":[]");

        this.load = function () {
            menuHandler = new MenuHandler();

            globalObj['layoutDefObj'].done(
            // getWebServerInfo(contrail.getCookie('project'),
                             function(menuObj) {
                var webServerInfo = globalObj['webServerInfo'];
                menuHandler.loadMenu(menuObj);
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
