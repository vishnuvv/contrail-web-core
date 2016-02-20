({
    mainConfigFile:"main.js",
    //name:"js/main",
    // appDir:"./",
    //Will optimize only files added as dependencies in modules??
    skipDirOptimize:true,
    optimizeCss:'none',
    optimize:'none',
    baseUrl:".",
    wrapShim:true,
    //Output directory
    dir:"dist",
    fileExclusionRegExp:/dist1/,
    findNestedDependencies:false,
    removeCombined:true,
    //out:"main.build.js",
    modules: [
        { 
            name:"js/main",
            exclude:[
                'js/jquery-libs',
                'js/thirdparty-libs',
                'js/contrail-libs',
                'js/contrail-core-views',
                'js/chart-libs',
                'js/contrail-layout'
            ]
        },{
            name:"js/jquery-libs",
        },{
            name:'js/thirdparty-libs',
            exclude:['jquery','jquery.event.drag']
        //     create:true,
        //     include:[
        // 'bootstrap',
        // 'lodash',
        // 'd3',
        // 'crossfilter',
        // 'jsonpath',
        // 'handlebars',
        // 'slick.core',
        // 'slick.grid',
        // 'slick.dataview',
        // 'slick.checkboxselectcolumn',
        // 'slick.rowselectionmodel',
        // 'select2',
        // 'moment',
        // 'jsbn-combined',
        // 'sprintf',
        // 'ipv6',
        // 'xdate',
        // 'slick.enhancementpager',
        // 'nv.d3',
        // 'joint',
        // 'geometry',
        // 'vectorizer',
        // 'joint.layout.DirectedGraph',
        // 'dagre',
        // 'vis',
        // 'bezier',
        // 'backbone',
        // 'knockback',
        // 'validation',
        // 'text',
        // 'underscore',
        // 'knockout'
        // ],
        },{
            name:'js/contrail-libs',
            exclude:['lodash','jquery','d3','handlebars','jquery-ui']
        },{
            name:'js/contrail-core-views',
            exclude:['lodash','jquery','backbone','knockback','knockout']
        },{
            name:'js/chart-libs',
            exclude:['jquery','d3']
        }
    ]
})
