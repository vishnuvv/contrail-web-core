/*
 * Copyright (c) 2015 Juniper Networks, Inc. All rights reserved.
 */
define([
    'underscore',
    'co-test-utils',
    'co-test-messages',
    'co-test-constants',
    'co-test-runner',
    'infoboxes',
    'co-infoboxes-view-mockdata'
], function (_, cotu, cotm, cotc, cotr, InfoboxesView, InfoboxesMockData) {
    var testSuiteClass = function (viewObj, suiteConfig){
        var viewConfig, el;
        if (viewObj != null) {
            viewConfig = cotu.getViewConfigObj(viewObj);
            el = viewObj.el;
        }
        tabsTemplate = contrail.getTemplate4Id(cowc.TMPL_INFOBOXES_VIEW),
        standAlone = _.result(suiteConfig, 'standAlone', true);
        var infoboxesViewTestSuite = cotr.createTestSuite('InfoboxesViewTestSuite');
        var basicTestGroup = infoboxesViewTestSuite.createTestGroup('basic');
        //module(cotu.formatTestModuleMessage(cotm.TEST_INFOBOXVIEW, el));
        if (standAlone) {
            el = "#content-container";
            module(cotu.formatTestModuleMessage(cotm.TEST_INFOBOXVIEW, el));
            var mockData = InfoboxesMockData['InfoboxesView']();
            var input = mockData[0]['inputData'];
            var output = mockData[0]['outputData'];
            var infoboxView = new InfoboxesView ({el: el});
            for(var i=0;i<input.length;i++) {
                infoboxView.add(input[i]);
            }
            var renderedHtml = $(el).html().replace(/\n/g, '').replace(/ /g, '');
        }
        basicTestGroup.registerTest(cotr.test('Compare the rendered html with mockdata', function () {
            equal(renderedHtml, output, "Rendered and mock html should be same");
        }, cotc.SEVERITY_LOW));
        /**
         * Load all the tabs
         */
        //basicTestGroup.registerTest(cotr.test(cotm.TABSVIEW_TAB_ACTIVATE, function () {
        //    expect(tabs.length);
        //    _.each(tabs, function(tab) {
        //
        //    });
        //}, cotc.SEVERITY_LOW));


        infoboxesViewTestSuite.run(suiteConfig.groups, suiteConfig.severity);

    };

    return testSuiteClass;
});
