/*
 * Copyright (c) 2016 Juniper Networks, Inc. All rights reserved.
 */

define([
    'underscore',
    'contrail-view',
    'contrail-list-model',
    'knockback'
], function (_, ContrailView, ContrailListModel, Knockback) {
    var tagsView = ContrailView.extend({
        render: function(options) {
            var self = this;
            var tagsArray = [],tagsDetails,actValue;
            self.renderView4Config($("#" + "tags_tab"),
                self.model,
                self.tagsViewConfig(tagsArray)
            );
        },
        tagsViewConfig: function(tagsArray) {
            return {
                elementId: "tags_id",
                view: 'SectionView',
                viewConfig: {
                    rows: [
                        {
                            columns: [
                                {
                                    elementId: 'tags_associate',
                                    view: 'FormMultiselectView',
                                    viewConfig: {
                                        label: "Associate Tags",
                                        path: 'tag_refs',
                                        dataBindValue: 'tag_refs',
                                        class: 'col-xs-10',
                                        elementConfig: {
                                            dataTextField: "text",
                                            dataValueField: "value",
                                            placeholder:
                                                "Select Tags",
                                                dataSource : {
                                                    type: 'remote',
                                                    requestType: 'post',
                                                    postData: JSON.stringify(
                                                          {data: [{type: 'tags'}]}),
                                                    url:'/api/tenants/config/get-config-details',
                                                    parse: function(result) {
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
                                                              tagsArray.push(data);
                                                          }
                                                      }
                                                        return tagsArray;
                                                    }
                                                }
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

    return tagsView;
});
