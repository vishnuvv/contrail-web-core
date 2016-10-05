/*
 * Copyright (c) 2016 Juniper Networks, Inc. All rights reserved.
 */
define(['underscore', 'contrail-view'], function(_, ContrailView){
    var CarouselView = ContrailView.extend({
        render: function(){
            var self = this,
                viewConfig = self.attributes.viewConfig,
                carouselTemplate = contrail.getTemplate4Id("carousal-view-template");

            self.viewList = viewConfig.pages;
            self.viewPlaceHolder = {};
            self.prevIndex = 0;
            self.currIndex = 0;
            self.lastIndex = viewConfig.pages.length;

            self.$el.html(carouselTemplate({pages:self.viewList}));
            self.viewPlaceHolder = self.$el.find(".carousel-content");
            activateView(self, self.currIndex, false);
        },
        next: function(){
            var self = this;
            deActivateCarouselIndicator(self.currIndex);
            self.currIndex = self.currIndex + 1;
            if(self.currIndex >= self.lastIndex){
                self.currIndex = 0;
            }
            if(self.prevIndex != self.currIndex){
                self.prevIndex = self.currIndex
                activateView(self, self.currIndex, true, 'next');
            }
        },
        prev: function(){
            var self = this;
            deActivateCarouselIndicator(self.currIndex);
            self.currIndex = self.currIndex - 1;
            if(self.currIndex < 0){
                self.currIndex = self.lastIndex - 1;
            }
            if(self.prevIndex != self.currIndex){
                self.prevIndex = self.currIndex
                activateView(self, self.currIndex, true, 'prev');
            }
        },
        events: {
            'click .custom-carousel-control-left': 'prev',
            'click .custom-carousel-control-right': 'next'
        }
    });

    function activateView(self, index, doAnimate, direction){
        var height = $('div.carousel').height(),
            page = self.viewList[index].page,
            model = ifNull(self.viewList[index].model, '');
        activateCarouselIndicator(self.currIndex);
        if(!doAnimate){
            self.renderView4Config(self.viewPlaceHolder,  model, page);
        }else{
            var slideDirection = ['left','right'],
                height = $('div.carousel').height();

            if(direction === 'prev')
                slideDirection = ['right','left'];

            $("div.carousel-content").hide("slide", { direction: slideDirection[0] }, 800, function() {
                //$('div.carousel').height(height);
                self.$el.find(".carousel-content").remove();
                self.$el.find(".carousel-inner").append($('<div class="carousel-content">'));
                $("div.carousel-content").show("slide", { direction: slideDirection[1] }, 300, function(){
                   self.renderView4Config(self.$el.find('.carousel-content'),  model, page, null, null, null, function(){
                       //setTimeout(function(){
                           //$('div.carousel').height($("div.carousel-inner").children().height() * 2);
                       //}, 1000);
                   });
                });
            });
        }
    }

    function activateCarouselIndicator(index, prevIndex){
        $(".carousel-indicators li#"+index).addClass('active');
    }

    function deActivateCarouselIndicator(index){
        $(".carousel-indicators li#"+index).removeClass('active');
    }

    return CarouselView;
});
