/*
 * Copyright (c) 2016 Juniper Networks, Inc. All rights reserved.
 */
var commonUtils = require('../utils/common.utils');
var rest = require('../common/rest.api');
var appErrors = require('../errors/app.errors');
var config = process.mainModule.exports.config;

var gohanServerIP = ((config.gohan) && (config.gohan.server_ip)) ?
    config.gohan.server_ip : global.DFLT_SERVER_IP;
var gohanServerPort = ((config.gohan) && (config.gohan.server_port)) ?
    config.gohan.server_port : '9500';
var gohanServer = rest.getAPIServer({apiName: 'gohan',
                                    server: gohanServerIP,
                                    port: gohanServerPort});
var authServerIP = ((config.identityManager) && (config.identityManager.ip)) ?
    config.identityManager.ip : global.DFLT_SERVER_IP;
var authServerPort =
    ((config.identityManager) && (config.identityManager.port)) ?
    config.identityManager.port : '5000';

var authAPIServer =
    rest.getAPIServer({apiName:global.label.IDENTITY_SERVER,
                      server:authServerIP, port:authServerPort});

function getGohanAllReq (req, res, next)
{
    console.log("Getting reqSession as:", req.session);
    var handler = require('../web/routes/handler')
    if (!handler.isSessionAuthenticated(req)) {
        commonUtils.redirectToLogout(req, res);
        return null;
    }
    var reqBody = req.body;
    var method = req.method.toLowerCase();
    var reqUrl = req.url;
    console.log("1getting reqUrl as:", req.method, reqUrl);
    var splitArr = reqUrl.split('/gohan_contrail');
    if (1 == splitArr.length) {
        next();
        return;
    }
    //console.log("Getting headres as:", req.headers);
    var reqUrl = splitArr[1];
    var headers = {'X-Auth-Token': req.session.last_token_used.id};
    if (global.HTTP_REQUEST_GET == method) {
        gohanServer.api.get(reqUrl, function(error, data) {
            console.log("Getting data as:", data);
            commonUtils.handleJSONResponse(error, res, data);
            return;
        }, headers);
    } else if (global.HTTP_REQUEST_PUT == method) {
        gohanServer.api.put(reqUrl, reqBody, function(error, data) {
            commonUtils.handleJSONResponse(error, res, data);
            return;
        }, headers);
    } else if (global.HTTP_REQUEST_POST == method) {
        gohanServer.api.post(reqUrl, reqBody, function(error, data) {
            commonUtils.handleJSONResponse(error, res, data);
            return;
        }, headers);
    } else if (global.HTTP_REQUEST_DEL == method) {
        gohanServer.api.delete(reqUrl, function(error, data) {
            commonUtils.handleJSONResponse(error, res, data);
            return;
        }, headers);
    } else {
        logutils.logger.error('Unknown GOHAN Req Method:' + method);
        var error =
            new appErrors.RESTServerError('Unknown GOHAN Req Method:' + method);
        commonUtils.handleJSONResponse(error, res, null);
        return;
    }
}

function getGohanAuthReq (req, res, next)
{
    var handler = require('../web/routes/handler')
    if (!handler.isSessionAuthenticated(req)) {
        commonUtils.redirectToLogout(req, res);
        return null;
    }
    var reqBody = req.body;
    var method = req.method.toLowerCase();
    var reqUrl = req.url;
    console.log("1getting reqUrl as:", req.method, reqUrl);
    var splitArr = reqUrl.split('/gohan_contrail_auth');
    if (1 == splitArr.length) {
        next();
        return;
    }
    var authApi = require('./auth.api');
    //console.log("Getting headres as:", req.headers);
    var reqUrl = splitArr[1];
 
    if (-1 != reqUrl.indexOf('/tokens')) {
        /* This is a token get request */
        var authObj = {req: req, project: req.cookies.project};
        console.log("Getting authObj as:", authObj.project);
        authApi.getTokenObj(authObj, function(error, token, tokenObj) {
            console.log("getting error as:", error, token);
            commonUtils.handleJSONResponse(error, res, tokenObj);
            return;
        });
        return;
    }
    authApi.getAuthRetryData(req.session.last_token_used, req, reqUrl,
                             function(error, data) {
        commonUtils.handleJSONResponse(error, res, data);
    });
}

exports.getGohanAllReq = getGohanAllReq;
exports.getGohanAuthReq = getGohanAuthReq;

