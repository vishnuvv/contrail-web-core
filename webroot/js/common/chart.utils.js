/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */

define([
    'underscore'
], function (_) {
    var chartUtils = {
        updateChartOnResize: function(selector,chart){
            if(selector != null && $(selector).is(':visible') && chart != null) {
                if($(selector).find('.nv-noData').data('customMsg')) {
                    var msg = $(selector).find('.nv-noData').text();
                    chart.update();
                    $(selector).find('.nv-noData').text(msg);
                } else if($(selector).data('chart') != null)
                    $(selector).data('chart').update();
            }
        },

        getViewFinderPoint: function (time) {
            var navDate = d3.time.format('%x %H:%M')(new Date(time));
            return new Date(navDate).getTime();
        },

        getCurrentTime4MemCPUCharts: function () {
            var now = new Date(), currentTime;
            currentTime = now.getTime();
            return currentTime;
        },

        interpolateSankey: function(points) {
            var x0 = points[0][0], y0 = points[0][1], x1, y1, x2,
                path = [x0, ",", y0],
                i = 0, n = points.length;
            while (++i < n) {
                x1 = points[i][0], y1 = points[i][1], x2 = (x0 + x1) / 2;
                path.push("C", x2, ",", y0, " ", x2, ",", y1, " ", x1, ",", y1);
                x0 = x1, y0 = y1;
            }
            return path.join("");
        },

        drawSparkLine4Selector: function(selector, className, data) {
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
        },

        drawSparkLineBar: function(selector, data) {
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
        },
        getDimensionsObj: function(elem) {
            return {
                width: $(window).width(),
                height:$(window).height(),
                elemWidth:$(elem).width(),
                elemHeight:$(elem).height()
            }
        },
        isReRenderRequired: function(cfg) {
            var elem = cfg['elem'];
            var prevDimensions = cfg['prevDimensions'];
            // console.info("last Dimensions",lastWidth,lastHeight,lastElemWidth,lastElemHeight);
            // console.info("current Dimensions",$(window).height(),$(window).width(),$(self.$el).width(),$(self.$el).height());
            if(prevDimensions['width'] == $(window).width() && prevDimensions['height'] == $(window).height() && 
                prevDimensions['elemWidth'] == $(self.$el).width() && prevDimensions['elemHeight'] == $(self.$el).height()) {
                return false;
            }
            return true;
        },
        make_editable: function(d, field) {
            console.log("make_editable", arguments);

            this
            .on("mouseover", function() {
                d3.select(this).style("fill", "red");
            })
            .on("mouseout", function() {
                d3.select(this).style("fill", null);
            })
            .on("click", function(d) {
                var p = this.parentNode;
                console.log(this, arguments);

                // inject a HTML form to edit the content here...

                // bug in the getBBox logic here, but don't know what I've done wrong here;
                // anyhow, the coordinates are completely off & wrong. :-((
                var xy = this.getBBox();
                // var p_xy = p.getBBox();
                //
                // xy.x -= p_xy.x;
                // xy.y -= p_xy.y;

                var el = d3.select(this);
                var p_el = d3.select(p);

                var frm = p_el.append("foreignObject");

                var inp = frm
                    // .attr("x", xy.x)
                    // .attr("y", xy.y)
                    .attr("x", 10)
                    .attr("y", 20)
                    .attr("width", 200)
                    .attr("height", 25)
                    .append("xhtml:form")
                    .append("input")
                    .attr("value", function() {
                        // nasty spot to place this call, but here we are sure that the <input> tag is available
                        // and is handily pointed at by 'this':
                        this.focus();

                        return d[field];
                    })
                    .attr("style", "width: 294px;")
                    // make the form go away when you jump out (form looses focus) or hit ENTER:
                    .on("blur", function() {
                        console.log("blur", this, arguments);

                        var txt = inp.node().value;

                        d[field] = txt;
                        el.text(function(d) { return d[field]; });

                        // Note to self: frm.remove() will remove the entire <g> group! Remember the D3 selection logic!
                        p_el.select("foreignObject").remove();
                    })
                    .on("keypress", function() {
                        console.log("keypress", this, arguments);

                        // IE fix
                        if (!d3.event)
                            d3.event = window.event;

                        var e = d3.event;
                        if (e.keyCode == 13)
                        {
                            if (typeof(e.cancelBubble) !== 'undefined') // IE
                            e.cancelBubble = true;
                            if (e.stopPropagation)
                            e.stopPropagation();
                            e.preventDefault();

                            var txt = inp.node().value;

                            d[field] = txt;
                            el
                                .text(function(d) { return d[field]; });

                            // odd. Should work in Safari, but the debugger crashes on this instead.
                            // Anyway, it SHOULD be here and it doesn't hurt otherwise.
                            try {
                                if(p_el.select("foreignObject")[0][0])
                                    p_el.select("foreignObject").remove();
                            } catch(e) {
                            }
                        }
                    });
                });
            }
        };
        return chartUtils;
});
