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
    fileExclusionRegExp:/^(dist1|config|monitor|reports|setting|test)$/,
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
            name:"js/nonamd-libs",      //Libraries which need to be placed in global scope (web-utils,...) and don't depend on jQuery
            exclude:['jquery','jquery-ui','knockout','bootstrap','jquery.xml2json','jquery.ba-bbq','jquery.json','d3'],
            override: {
                wrapShim: false
            }
        }/*,{
            name:"js/layout-libs",      //Libraries that need for layout and don't depend on jQuery
            exclude:['jquery','jquery-ui','knockout'],
            override: {
                wrapShim: false
            }
        }*/,{
            name:"js/jquery-dep-libs",  //Libraries that depend on jQuery and used for layout
            exclude:['jquery','jquery-ui'],
            override: {
                wrapShim: false
            }
        },{
            name:"js/core-bundle",
            exclude:['jquery','jquery-ui','underscore']
        },{
            name:"js/jquery-libs",
            exclude:['jquery','jquery-ui']
        }/*,{
            name:"js/jquery-load-libs",
            exclude:['jquery']
        },{
            name:"js/load-libs",
            exclude:['jquery','jquery.event.drag','d3','backbone','bootstrap','knockout']
        }*/,{
            name:'js/thirdparty-libs',
            exclude:['jquery','jquery.event.drag']
        //     create:true,
        }/*,{
            name:'js/contrail-libs',
            exclude:['lodash','jquery','d3','handlebars','jquery-ui','jquery.event.drag','backbone','knockout','knockback']
        }*/,{
            name:'js/contrail-core-views',
            exclude:['lodash','jquery','backbone','knockback','knockout','contrail-remote-data-handler','contrail-view',
                'contrail-list-model','contrail-model','contrail-view-model','d3','nv.d3','slick.checkboxselectcolumn','jquery.event.drag',
                'slick.grid','slick.rowselectionmodel']
        },{
            name:'js/chart-libs',
            exclude:['jquery','lodash','backbone']
        }
    ]
})
