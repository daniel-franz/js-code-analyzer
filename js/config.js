var projectBuildFile = '<proj>/scripts/build.html';
var options = {
    jsLintOpts: {
        devel: true,
        eqeqeq: false,
        forin: true,
        browser: true,
        windows: false,
        rhino: false,
        onevar: false,
        immed: true,
        undef: true,
        nomen: false,
        plusplus: false,
        es5: false,
        maxlen: 120,
        indent: 4,
        newcap: false,
        css: true,
        white: true,
        predef: [
            'window', 'jQuery', 'steal', '$', 'can'
        ]
    },
    analyzerOpts: {
        doStatistics: true,
        doDependencies: true,
        doOpenAjaxEvents: true,
        doCyclomaticComplexity: true,
        cycCompThreshold: 10,
        shortVarWhitelist: ['me', 'x', 'y', 'to'],
        aliases: [['$', 'jQuery']]
    },
    pathPrefix: '',
    fileWhitelist: ['<proj>'],
    fileBlacklist: ['<proj>/external-resources']
};
