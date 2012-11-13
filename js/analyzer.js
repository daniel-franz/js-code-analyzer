/*jslint rhino: true */
/*
 Copyright (C) 2012 Daniel Franz <daniel2712@gmail.com>

 Redistribution and use in source and binary forms, with or without
 modification, are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright
    notice, this list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright
    notice, this list of conditions and the following disclaimer in the
    documentation and/or other materials provided with the distribution.

 THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
 DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

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

    if (urls.length) {
        options.fileWhitelist.push.apply(options.fileWhitelist, urls);
    } else {
        urls = projectBuildFile;
        console.log('No URLs/Files given, analyzing whole project');
    }

    options.consoleOutput = commandLineOpts['-i'] || commandLineOpts['-c'];

    if (options.consoleOutput) {
        var ret;
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
        steal.analyze(urls, options);
    }
});
