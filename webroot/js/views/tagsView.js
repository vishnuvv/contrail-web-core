/*
 * Copyright (c) 2016 Juniper Networks, Inc. All rights reserved.
 */

define([
    'underscore',
    'contrail-view',
    'knockback'
], function (_, ContrailView, Knockback) {
    var tagsView = ContrailView.extend({
        render: function(options) {
            var self = this;
            var tagsDetails,actValue,textValue;
            self.renderView4Config($("#" + "tags_tab"),
                self.model,
                self.tagsViewConfig()
            );
        },
        tagsViewConfig: function() {
            return {
                elementId: "tags_id",
                view: 'SectionView',
                viewConfig: {
                    rows: [
                        {
                            columns: [
                                {
                                    elementId: 'Application',
                                    view: 'FormDropdownView',
                                    viewConfig: {
                                        label: "Application",
                                        path: 'Application',
                                        dataBindValue: 'Application',
                                        class: 'col-xs-6',
                                        elementConfig: {
                                            dataTextField: "text",
                                            dataValueField: "value",
                                            placeholder:
                                                "Select Application Tag",
                                                dataSource : getDataSourceForDropdown('application')
                                        }
                                    }
                                }
                            ]
                        },
                        {
                            columns: [
                                {
                                    elementId: 'Deployment',
                                    view: 'FormDropdownView',
                                    viewConfig: {
                                        label: "Deployment",
                                        path: 'Deployment',
                                        dataBindValue: 'Deployment',
                                        class: 'col-xs-6',
                                        elementConfig: {
                                            dataTextField: "text",
                                            dataValueField: "value",
                                            placeholder:
                                                "Select Deployment Tag",
                                                dataSource : getDataSourceForDropdown('deployment')
                                        }
                                    }
                                }
                            ]
                        },
                        {
                            columns: [
                                {
                                    elementId: 'Site',
                                    view: 'FormDropdownView',
                                    viewConfig: {
                                        label: "Site",
                                        path: 'Site',
                                        dataBindValue: 'Site',
                                        class: 'col-xs-6',
                                        elementConfig: {
                                            dataTextField: "text",
                                            dataValueField: "value",
                                            placeholder:
                                                "Select Site Tag",
                                                dataSource : getDataSourceForDropdown('site')
                                        }
                                    }
                                }
                            ]
                        },
                        {
                            columns: [
                                {
                                    elementId: 'Tier',
                                    view: 'FormDropdownView',
                                    viewConfig: {
                                        label: "Tier",
                                        path: 'Tier',
                                        dataBindValue: 'Tier',
                                        class: 'col-xs-6',
                                        elementConfig: {
                                            dataTextField: "text",
                                            dataValueField: "value",
                                            placeholder:
                                                "Select Tier Tag",
                                                dataSource : getDataSourceForDropdown('tier')
                                        }
                                    }
                                }
                            ]
                        },
                        {
                            columns: [
                                {
                                    elementId: 'Labels',
                                    view: 'FormMultiselectView',
                                    viewConfig: {
                                        label: "Labels",
                                        path: 'Labels',
                                        dataBindValue: 'Labels',
                                        class: 'col-xs-6',
                                        elementConfig: {
                                            dataTextField: "text",
                                            dataValueField: "value",
                                            placeholder:
                                                "Select Labels",
                                                dataSource : getDataSourceForDropdown('label')
                                        }
                                    }
                                }
                            ]
                        }
                    ]
                }
            }
        }
    });
    function tagsParser(result, tagName) {
 var textValue, actValue, tagsArray = [];
        if(tagName != "label"){
            tagsArray.push({'text':"None","value":"None"});
        }
        for(var i=0; i<result.length; i++){
          tagsDetails = result[i].tags;
          for(var j= 0; j<tagsDetails.length; j++){
              if(tagsDetails[j].tag.fq_name &&
                      tagsDetails[j].tag.fq_name.length === 1) {
                  actValue = tagsDetails[j].tag.fq_name[0];
              }
              else{
                  actValue =  tagsDetails[j].tag.fq_name[0] +
                  ":" + tagsDetails[j].tag.fq_name[1] +
                  ":" + tagsDetails[j].tag.fq_name[2];
              }
              data = {
                      "text":tagsDetails[j].tag.name,
                      "value":actValue
                 };
              if (tagsDetails[j].tag.tag_type === tagName) {
                  tagsArray.push(data);
              }
             
          }
      }
        console.log(tagsArray);
        return tagsArray;
    
    }
    
    function getDataSourceForDropdown (tagName) {
        return {
            type: 'remote',
            requestType: 'post',
            postData: JSON.stringify(
                  {data: [{type: 'tags'}]}),
            url:'/api/tenants/config/get-config-details',
            parse: function(result) {
                return tagsParser(result,tagName);
            }
        }
    }
    return tagsView;
});
