/*
 * Copyright (c) 2015 Juniper Networks, Inc. All rights reserved.
 */

define(['underscore'], function (_) {
	var self = this;
	self.mockDataMap = {
		'InfoboxesView': function () {
			var InfoboxDetailView = Backbone.View.extend({
				/*tagName: 'div',
				initialize: function (options) {
					this.className = options['className'],
					this.title = options['title']
				},*/
				render: function () {
					this.$el.html(this.model.get('title'));
				}
			});
			var InfoboxDetailModel = Backbone.Model.extend({
				defaults: {
					title: 'Virtual Routers'
				}
			});
			
			return [{
				description: "Adds 4 infoboxes",
				inputData: [{
		            title: 'Virtual Routers',
		            view: InfoboxDetailView,
		            model: new InfoboxDetailModel({title: 'Virtual Routers'}),
		            //downCntFn: dashboardUtils.getDownNodeCnt
		        }, {
		            title: 'Control Nodes',
		            view: InfoboxDetailView,
		            model: new InfoboxDetailModel({title: 'Control Nodes'}),
		            //downCntFn: dashboardUtils.getDownNodeCnt
		        },{
		            title: 'Analytics Nodes',
		            view: InfoboxDetailView,
		            model: new InfoboxDetailModel({title: 'Analytics Nodes'}),
		            //downCntFn: dashboardUtils.getDownNodeCnt
		        },{
		            title: 'Config Nodes',
		            view: InfoboxDetailView,
		            model: new InfoboxDetailModel({title: 'Config Nodes'}),
		            //downCntFn: dashboardUtils.getDownNodeCnt
		        },{
		            title: 'Database Nodes',
		            view: InfoboxDetailView,
		            model: new InfoboxDetailModel({title: 'Database Nodes'}),
		            //downCntFn: dashboardUtils.getDownNodeCnt
		        }],
				outputData: ['<div class="infobox-widget"><div class="infobox-container row"><div class="control-panel-items pull-right">'+
				'<div class="control-panel-item refresh" data-action="refresh" title="Refresh"><i class="fa fa-repeat"></i></div></div>'+
			    '<div class="infobox pull-left infobox-blue infobox-dark active"><div class="infobox-icon"><i class="fa fa-sitemap"></i></div>'+
		        '<div class="infobox-data"><span class="infobox-data-number"></span></div><div style="display:none" class="stat stat-important"></div>'+
		        '<div class="infobox-content">Virtual Routers</div></div><div class="infobox infobox-grey pull-left"><div class="infobox-icon">'+
		        '<i class="fa fa-sitemap"></i></div><div class="infobox-data"><span class="infobox-data-number"></span></div>'+
		        '<div style="display:none" class="stat stat-important"></div><div class="infobox-content">Control Nodes</div></div>'+
		        '<div class="infobox infobox-grey pull-left"><div class="infobox-icon"><i class="fa fa-sitemap"></i></div>'+
			    '<div class="infobox-data"><span class="infobox-data-number"></span></div><div style="display:none" class="stat stat-important"></div>'+
			    '<div class="infobox-content">Analytics Nodes</div></div><div class="infobox infobox-grey pull-left"><div class="infobox-icon">'+
			    '<i class="fa fa-sitemap"></i></div><div class="infobox-data"><span class="infobox-data-number"></span></div>'+
			    '<div style="display:none" class="stat stat-important"></div><div class="infobox-content">Config Nodes</div></div>'+
			    '<div class="infobox infobox-grey pull-left"><div class="infobox-icon"><i class="fa fa-sitemap"></i></div>'+
			    '<div class="infobox-data"><span class="infobox-data-number"></span></div><div style="display:none" class="stat stat-important"></div>'+
			    '<div class="infobox-content">Database Nodes</div></div></div><hr class="hr-8"><div class="infobox-detail-container">'+
			    '<div class="infobox-detail-item">Virtual Routers</div><div class="infobox-detail-item">Control Nodes</div>'+
			    '<div class="infobox-detail-item">Analytics Nodes</div><div class="infobox-detail-item">Config Nodes</div>'+
			    '<div class="infobox-detail-item">Database Nodes</div></div><hr></div>']
			}]
		},
	}
	return self.mockDataMap;
})