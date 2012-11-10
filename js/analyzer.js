/*jslint rhino: true */

load("steal/rhino/rhino.js");

steal('analyzer/js/analyze.js').then(function () {
    steal.analyze('<proj>/scripts/build.html', {
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
            shortVarWhitelist: ['me', 'x', 'y']
        },
        pathPrefix: '',
        fileWhitelist: ['<proj>'],
        fileBlacklist: ['<proj>/external-resources']
    });
});
