/*jslint rhino: true */

load("steal/rhino/rhino.js");

steal('analyzer/js/analyze.js', 'analyzer/js/helpers.js').then(function () {
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
            shortVarWhitelist: ['me', 'x', 'y']
        },
        pathPrefix: '',
        fileWhitelist: ['<proj>'],
        fileBlacklist: ['<proj>/external-resources']
    };
    var commandLineOpts = {};
    var urls = [];
    if (_args[0]) {
        if (_args[0] === '--help' || _args[0] === '-h') {
            print('analyzer/bin/analyze <options> <files>');
            print('   -c           console output');
            print('   -i      interactive console');
            print('   -h                this help');
            return;
        }
        for (var i = 0; i < _args.length; i++) {
            if (_args[i].indexOf('-') === 0) {
                commandLineOpts[_args[i]] = true;
                continue;
            }
            urls.push(_args[i]);
        }
    }

    options.consoleOutput = commandLineOpts['-i'] || commandLineOpts['-c'];

    if (urls.length) {
        var ret;
        options.fileWhitelist.push.apply(options.fileWhitelist, urls);
        options.analyzerOpts.doStatistics = false;
        options.analyzerOpts.doDependencies = false;
        options.analyzerOpts.doOpenAjaxEvents = false;
        options.analyzerOpts.doCyclomaticComplexity = false;

        var console = ioDrivers.openConsole();
        do {
            ret = steal.analyze(urls, options);
        } while (
            commandLineOpts['-i'] &&
            (console.print('Any key to re-check, x to exit') || true) &&
            console.read() != 'x' &&
            ret !== false
        );
    } else {
        steal.analyze(projectBuildFile, options);
    }
});
